import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import Note from '../models/Note.js';
import Subject from '../models/Subject.js';
import Review from '../models/Review.js';
import Report from '../models/Report.js';

import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   HELPERS
========================================================= */

const escapeRegex = (value = '') => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/*
  Frontend branch filter sends:

  CSE / IT / ECE / ME / CE

  Database may contain different formats.
*/
const getBranchRegex = (branch) => {
  switch (branch) {
    case 'CSE':
      return /^(CSE|Computer Science|Computer Science Engineering|Computer Science and Engineering|Computer Science & Engineering|Computer Science\s*\(\s*CSE\s*\))$/i;

    case 'IT':
      return /^(IT|Information Technology|Information Technology Engineering|Information Technology and Engineering|Information Technology\s*\(\s*IT\s*\))$/i;

    case 'ECE':
      return /^(ECE|Electronics|Electronics & Communication|Electronics and Communication|Electronics & Comm|Electronics and Communication Engineering|Electronics\s*&\s*Comm\s*\(\s*ECE\s*\))$/i;

    case 'ME':
      return /^(ME|Mechanical|Mechanical Engineering|Mechanical Eng|Mechanical Engineering\s*\(\s*ME\s*\)|Mechanical Eng\s*\(\s*ME\s*\))$/i;

    case 'CE':
      return /^(CE|Civil|Civil Engineering|Civil Eng|Civil Engineering\s*\(\s*CE\s*\)|Civil Eng\s*\(\s*CE\s*\))$/i;

    default:
      return new RegExp(`^${escapeRegex(branch)}$`, 'i');
  }
};

/* =========================================================
   GET ALL APPROVED NOTES
   GET /api/notes

   IMPORTANT:
   ONLY APPROVED NOTES ARE PUBLIC.
========================================================= */

export const getNotes = async (req, res, next) => {
  try {
    const {
      search = '',
      subject,
      semester,
      branch,
      sort = 'latest',
      page = 1,
      limit = 12,
    } = req.query;

    /*
      Only status = approved is allowed.

      Pending notes:
      - Not visible

      Rejected notes:
      - Not visible

      Missing status:
      - Not visible
    */
    const query = {
      status: 'approved',
    };

    /* -------------------------
       SEARCH
    ------------------------- */

    if (search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        'i'
      );

      query.$and = [
        {
          $or: [
            {
              title: searchRegex,
            },
            {
              description: searchRegex,
            },
            {
              tags: searchRegex,
            },
          ],
        },
      ];
    }

    /* -------------------------
       SUBJECT FILTER
    ------------------------- */

    if (
      subject &&
      subject !== 'all' &&
      mongoose.Types.ObjectId.isValid(subject)
    ) {
      query.subject = subject;
    }

    /* -------------------------
       SEMESTER FILTER
    ------------------------- */

    if (
      semester &&
      semester !== 'all' &&
      !Number.isNaN(Number(semester))
    ) {
      query.semester = Number(semester);
    }

    /* -------------------------
       BRANCH FILTER
    ------------------------- */

    if (
      branch &&
      branch !== 'all'
    ) {
      query.branch = getBranchRegex(branch);
    }

    /* -------------------------
       SORT
    ------------------------- */

    let sortOption = {
      createdAt: -1,
    };

    switch (sort) {
      case 'popular':
        sortOption = {
          downloadCount: -1,
          createdAt: -1,
        };
        break;

      case 'rating':
        sortOption = {
          averageRating: -1,
          totalReviews: -1,
        };
        break;

      case 'oldest':
        sortOption = {
          createdAt: 1,
        };
        break;

      case 'latest':
      default:
        sortOption = {
          createdAt: -1,
        };
        break;
    }

    /* -------------------------
       PAGINATION
    ------------------------- */

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 12, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const [
      notes,
      total,
    ] = await Promise.all([
      Note.find(query)
        .populate(
          'subject',
          'name code'
        )
        .populate(
          'uploadedBy',
          'name email role'
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Note.countDocuments(query),
    ]);

    res.json({
      success: true,
      notes,
      total,
      page: pageNumber,
      pages: Math.ceil(
        total / limitNumber
      ),
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET SINGLE NOTE
   GET /api/notes/:id

   ONLY APPROVED NOTES ARE AVAILABLE.
========================================================= */

export const getNoteById = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400);

      throw new Error(
        'Invalid note ID'
      );
    }

    const note = await Note.findById(id)
      .populate(
        'subject',
        'name code'
      )
      .populate(
        'uploadedBy',
        'name email role'
      );

    if (!note) {
      res.status(404);

      throw new Error(
        'Note not found'
      );
    }

    /*
      Pending/rejected notes cannot be viewed
      through the normal student note API.
    */
    if (note.status !== 'approved') {
      res.status(404);

      throw new Error(
        'Note is not available'
      );
    }

    res.json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CREATE NOTE
   POST /api/notes

   STUDENT:
   pending

   ADMIN:
   automatically approved
========================================================= */

export const createNote = async (
  req,
  res,
  next
) => {
  try {
    const {
      title,
      description,
      subject,
      semester,
      branch,
      tags,
    } = req.body;

    /* -------------------------
       FILE VALIDATION
    ------------------------- */

    if (!req.file) {
      res.status(400);

      throw new Error(
        'Please upload a PDF file'
      );
    }

    /* -------------------------
       FIELD VALIDATION
    ------------------------- */

    if (!title?.trim()) {
      res.status(400);

      throw new Error(
        'Note title is required'
      );
    }

    if (!description?.trim()) {
      res.status(400);

      throw new Error(
        'Note description is required'
      );
    }

    if (!subject) {
      res.status(400);

      throw new Error(
        'Subject is required'
      );
    }

    if (!semester) {
      res.status(400);

      throw new Error(
        'Semester is required'
      );
    }

    if (!branch?.trim()) {
      res.status(400);

      throw new Error(
        'Branch is required'
      );
    }

    /* -------------------------
       SUBJECT VALIDATION
    ------------------------- */

    if (
      !mongoose.Types.ObjectId.isValid(
        subject
      )
    ) {
      res.status(400);

      throw new Error(
        'Invalid subject'
      );
    }

    const subjectExists =
      await Subject.findById(subject);

    if (!subjectExists) {
      res.status(404);

      throw new Error(
        'Subject not found'
      );
    }

    /* -------------------------
       TAGS
    ------------------------- */

    let parsedTags = [];

    if (Array.isArray(tags)) {
      parsedTags = tags
        .map((tag) =>
          String(tag).trim()
        )
        .filter(Boolean);
    } else if (
      typeof tags === 'string' &&
      tags.trim()
    ) {
      parsedTags = tags
        .split(',')
        .map((tag) =>
          tag.trim()
        )
        .filter(Boolean);
    }

    /* =====================================================
       CLOUDINARY PDF UPLOAD

       resource_type = image
       format = pdf

       This allows browser PDF preview.
    ===================================================== */

    const uploadToCloudinary = () => {
      return new Promise(
        (resolve, reject) => {
          const uploadStream =
            cloudinary.uploader.upload_stream(
              {
                folder:
                  'notehub/pdfs',

                resource_type:
                  'image',

                format:
                  'pdf',

                public_id:
                  `${Date.now()}-${path
                    .basename(
                      req.file.originalname,
                      path.extname(
                        req.file.originalname
                      )
                    )
                    .replace(
                      /[^a-zA-Z0-9-_]/g,
                      '-'
                    )}`,
              },

              (
                error,
                result
              ) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );

          streamifier
            .createReadStream(
              req.file.buffer
            )
            .pipe(uploadStream);
        }
      );
    };

    const cloudinaryResult =
      await uploadToCloudinary();

    /* -------------------------
       ADMIN = AUTO APPROVED
       STUDENT = PENDING
    ------------------------- */

    const isAdmin =
      req.user &&
      String(
        req.user.role
      ).toLowerCase() === 'admin';

    const noteStatus =
      isAdmin
        ? 'approved'
        : 'pending';

    /* -------------------------
       CREATE NOTE
    ------------------------- */

    const note = await Note.create({
      title:
        title.trim(),

      description:
        description.trim(),

      subject,

      semester:
        Number(semester),

      branch:
        branch.trim(),

      tags:
        parsedTags,

      fileUrl:
        cloudinaryResult.secure_url,

      originalFileName:
        req.file.originalname,

      fileSize:
        req.file.size,

      uploadedBy:
        req.user._id,

      status:
        noteStatus,

      rejectionReason:
        '',

      reviewedBy:
        isAdmin
          ? req.user._id
          : null,

      reviewedAt:
        isAdmin
          ? new Date()
          : null,

      downloadCount:
        0,

      averageRating:
        0,

      totalReviews:
        0,
    });

    const populatedNote =
      await Note.findById(
        note._id
      )
        .populate(
          'subject',
          'name code'
        )
        .populate(
          'uploadedBy',
          'name email role'
        );

    /* -------------------------
       STUDENT RESPONSE
    ------------------------- */

    if (
      noteStatus === 'pending'
    ) {
      return res.status(201).json({
        success: true,

        message:
          'Note uploaded successfully. Pending for admin verification.',

        note:
          populatedNote,
      });
    }

    /* -------------------------
       ADMIN RESPONSE
    ------------------------- */

    return res.status(201).json({
      success: true,

      message:
        'Note uploaded successfully.',

      note:
        populatedNote,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   UPDATE NOTE
   PUT /api/notes/:id
========================================================= */

export const updateNote = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400);

      throw new Error(
        'Invalid note ID'
      );
    }

    const note =
      await Note.findById(id);

    if (!note) {
      res.status(404);

      throw new Error(
        'Note not found'
      );
    }

    const isAdmin =
      req.user &&
      String(
        req.user.role
      ).toLowerCase() === 'admin';

    const isOwner =
      String(
        note.uploadedBy
      ) === String(
        req.user._id
      );

    if (
      !isAdmin &&
      !isOwner
    ) {
      res.status(403);

      throw new Error(
        'You are not authorized to update this note'
      );
    }

    const {
      title,
      description,
      subject,
      semester,
      branch,
      tags,
      status,
      rejectionReason,
    } = req.body;

    /* -------------------------
       NORMAL NOTE FIELDS
    ------------------------- */

    if (
      title !== undefined
    ) {
      note.title =
        String(title).trim();
    }

    if (
      description !== undefined
    ) {
      note.description =
        String(description).trim();
    }

    if (
      subject !== undefined
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(
          subject
        )
      ) {
        res.status(400);

        throw new Error(
          'Invalid subject'
        );
      }

      const subjectExists =
        await Subject.findById(
          subject
        );

      if (!subjectExists) {
        res.status(404);

        throw new Error(
          'Subject not found'
        );
      }

      note.subject =
        subject;
    }

    if (
      semester !== undefined
    ) {
      note.semester =
        Number(semester);
    }

    if (
      branch !== undefined
    ) {
      note.branch =
        String(branch).trim();
    }

    if (
      tags !== undefined
    ) {
      if (
        Array.isArray(tags)
      ) {
        note.tags =
          tags
            .map((tag) =>
              String(tag).trim()
            )
            .filter(Boolean);
      } else if (
        typeof tags === 'string'
      ) {
        note.tags =
          tags
            .split(',')
            .map((tag) =>
              tag.trim()
            )
            .filter(Boolean);
      }
    }

    /* -------------------------
       ADMIN STATUS UPDATE
    ------------------------- */

    if (
      isAdmin &&
      status !== undefined
    ) {
      const allowedStatuses = [
        'pending',
        'approved',
        'rejected',
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        res.status(400);

        throw new Error(
          'Invalid note status'
        );
      }

      note.status =
        status;

      if (
        status === 'approved'
      ) {
        note.rejectionReason =
          '';

        note.reviewedBy =
          req.user._id;

        note.reviewedAt =
          new Date();
      }

      if (
        status === 'rejected'
      ) {
        note.rejectionReason =
          rejectionReason?.trim() ||
          'Note rejected by admin';

        note.reviewedBy =
          req.user._id;

        note.reviewedAt =
          new Date();
      }

      if (
        status === 'pending'
      ) {
        note.rejectionReason =
          '';

        note.reviewedBy =
          null;

        note.reviewedAt =
          null;
      }
    }

    await note.save();

    const updatedNote =
      await Note.findById(
        note._id
      )
        .populate(
          'subject',
          'name code'
        )
        .populate(
          'uploadedBy',
          'name email role'
        );

    res.json({
      success: true,

      message:
        'Note updated successfully',

      note:
        updatedNote,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   DELETE NOTE
   DELETE /api/notes/:id
========================================================= */

export const deleteNote = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400);

      throw new Error(
        'Invalid note ID'
      );
    }

    const note =
      await Note.findById(id);

    if (!note) {
      res.status(404);

      throw new Error(
        'Note not found'
      );
    }

    const isAdmin =
      req.user &&
      String(
        req.user.role
      ).toLowerCase() === 'admin';

    const isOwner =
      String(
        note.uploadedBy
      ) === String(
        req.user._id
      );

    if (
      !isAdmin &&
      !isOwner
    ) {
      res.status(403);

      throw new Error(
        'You are not authorized to delete this note'
      );
    }

    /* -------------------------
       DELETE CLOUDINARY FILE
    ------------------------- */

    if (
      note.fileUrl?.includes(
        'cloudinary.com'
      )
    ) {
      try {
        const urlParts =
          note.fileUrl.split('/');

        const uploadIndex =
          urlParts.indexOf(
            'upload'
          );

        if (
          uploadIndex !== -1
        ) {
          let publicIdParts =
            urlParts.slice(
              uploadIndex + 1
            );

          /*
            Remove version such as:
            v1790426277
          */

          if (
            publicIdParts[0] &&
            /^v\d+$/.test(
              publicIdParts[0]
            )
          ) {
            publicIdParts.shift();
          }

          let publicId =
            publicIdParts.join(
              '/'
            );

          /*
            Remove extension
          */

          publicId =
            publicId.replace(
              /\.[^/.]+$/,
              ''
            );

          await cloudinary
            .uploader
            .destroy(
              publicId,
              {
                resource_type:
                  'image',
              }
            );
        }
      } catch (
        cloudinaryError
      ) {
        console.error(
          'Cloudinary delete warning:',
          cloudinaryError.message
        );
      }
    }

    await note.deleteOne();

    res.json({
      success: true,

      message:
        'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET MY UPLOADS
   GET /api/notes/my-uploads

   Student can see:
   - Pending
   - Approved
   - Rejected

   This is intentional because the uploader
   should know the status of their own notes.
========================================================= */

export const getMyUploads = async (
  req,
  res,
  next
) => {
  try {
    const notes =
      await Note.find({
        uploadedBy:
          req.user._id,
      })
        .populate(
          'subject',
          'name code'
        )
        .populate(
          'uploadedBy',
          'name email role'
        )
        .sort({
          createdAt: -1,
        });

    res.json({
      success: true,

      notes,

      total:
        notes.length,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   DOWNLOAD NOTE
   GET /api/notes/:id/download

   ONLY APPROVED NOTES CAN BE DOWNLOADED.

   IMPORTANT FIX:
   We DO NOT redirect the browser to Cloudinary.

   Instead:
   1. Backend authenticates the user.
   2. Backend checks note status.
   3. Backend fetches PDF from Cloudinary.
   4. Backend sends PDF directly to frontend.

   This prevents the second unauthenticated request
   that was causing the 401 problem.
========================================================= */

export const downloadNote = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    /* -------------------------
       VALIDATE NOTE ID
    ------------------------- */

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400);

      throw new Error(
        'Invalid note ID'
      );
    }

    /* -------------------------
       FIND NOTE
    ------------------------- */

    const note =
      await Note.findById(id);

    if (!note) {
      res.status(404);

      throw new Error(
        'Note not found'
      );
    }

    /* -------------------------
       ONLY APPROVED NOTES
    ------------------------- */

    if (
      note.status !== 'approved'
    ) {
      res.status(403);

      throw new Error(
        'This note is not available for download'
      );
    }

    /* -------------------------
       FILE URL CHECK
    ------------------------- */

    if (!note.fileUrl) {
      res.status(404);

      throw new Error(
        'PDF file is not available'
      );
    }

    /* =====================================================
       CLOUDINARY PDF

       Instead of:

       res.redirect(note.fileUrl)

       we fetch the PDF on the server and return it.

       This keeps authentication on our backend.
    ===================================================== */

    if (
      note.fileUrl.startsWith('http://') ||
      note.fileUrl.startsWith('https://')
    ) {
      console.log(
        'Fetching PDF from Cloudinary:',
        note._id.toString()
      );

      const cloudinaryResponse =
        await fetch(note.fileUrl);

      if (
        !cloudinaryResponse.ok
      ) {
        console.error(
          'Cloudinary PDF fetch failed:',
          cloudinaryResponse.status,
          cloudinaryResponse.statusText
        );

        res.status(502);

        throw new Error(
          'Unable to retrieve PDF from cloud storage'
        );
      }

      const contentType =
        cloudinaryResponse.headers.get(
          'content-type'
        ) || 'application/pdf';

      const contentLength =
        cloudinaryResponse.headers.get(
          'content-length'
        );

      /*
        Fetch PDF as ArrayBuffer.

        Node.js converts this into a Buffer,
        which Express can send to the browser.
      */

      const arrayBuffer =
        await cloudinaryResponse.arrayBuffer();

      const pdfBuffer =
        Buffer.from(arrayBuffer);

      /* -------------------------
         DOWNLOAD COUNT
      ------------------------- */

      note.downloadCount =
        (note.downloadCount || 0) + 1;

      await note.save();

      /* -------------------------
         RESPONSE HEADERS
      ------------------------- */

      res.setHeader(
        'Content-Type',
        contentType
      );

      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(
          note.originalFileName ||
            'note.pdf'
        )}"`
      );

      if (contentLength) {
        res.setHeader(
          'Content-Length',
          pdfBuffer.length
        );
      }

      res.setHeader(
        'Cache-Control',
        'private, no-cache, no-store, must-revalidate'
      );

      console.log(
        'Sending PDF to frontend:',
        note.originalFileName ||
          'note.pdf'
      );

      return res.send(
        pdfBuffer
      );
    }

    /* =====================================================
       OLD LOCAL FILE SUPPORT

       This is kept for old notes that may still have
       local file paths.
    ===================================================== */

    let filePath =
      note.fileUrl;

    if (
      filePath.startsWith('/')
    ) {
      filePath =
        filePath.substring(1);
    }

    const absolutePath =
      path.resolve(
        __dirname,
        '..',
        filePath
      );

    if (
      !fs.existsSync(
        absolutePath
      )
    ) {
      res.status(404);

      throw new Error(
        'PDF file not found'
      );
    }

    /* -------------------------
       DOWNLOAD COUNT
    ------------------------- */

    note.downloadCount =
      (note.downloadCount || 0) + 1;

    await note.save();

    /* -------------------------
       LOCAL PDF RESPONSE
    ------------------------- */

    res.setHeader(
      'Content-Type',
      'application/pdf'
    );

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(
        note.originalFileName ||
          'note.pdf'
      )}"`
    );

    return res.sendFile(
      absolutePath
    );
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   REPORT NOTE
   POST /api/notes/:id/report

   ONLY APPROVED NOTES CAN BE REPORTED.
========================================================= */

export const reportNote = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const {
      reason,
      description,
    } = req.body;

    /* -------------------------
       VALIDATE NOTE ID
    ------------------------- */

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400);

      throw new Error(
        'Invalid note ID'
      );
    }

    /* -------------------------
       FIND NOTE
    ------------------------- */

    const note =
      await Note.findById(id);

    if (!note) {
      res.status(404);

      throw new Error(
        'Note not found'
      );
    }

    /* -------------------------
       ONLY APPROVED NOTES
    ------------------------- */

    if (
      note.status !== 'approved'
    ) {
      res.status(400);

      throw new Error(
        'This note cannot be reported'
      );
    }

    /* -------------------------
       REPORT REASON
    ------------------------- */

    if (
      !reason?.trim()
    ) {
      res.status(400);

      throw new Error(
        'Report reason is required'
      );
    }

    /* -------------------------
       CREATE REPORT
    ------------------------- */

    const report =
      await Report.create({
        note:
          note._id,

        reportedBy:
          req.user._id,

        reason:
          reason.trim(),

        description:
          description?.trim() ||
          '',

        status:
          'pending',
      });

    res.status(201).json({
      success: true,

      message:
        'Report submitted successfully. Admin will review it.',

      report,
    });
  } catch (error) {
    next(error);
  }
};