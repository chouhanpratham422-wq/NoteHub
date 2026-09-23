import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Note from '../models/Note.js';
import Review from '../models/Review.js';
import Report from '../models/Report.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Generate valid standard PDF 1.4 buffer
function createSamplePdfBuffer(title, subjectName, authorName) {
  const contentStream = `BT
/F1 18 Tf
50 720 Td
(${title.replace(/[()]/g, '')}) Tj
0 -30 Td
/F1 12 Tf
(Subject: ${subjectName.replace(/[()]/g, '')} | Author: ${authorName.replace(/[()]/g, '')}) Tj
0 -25 Td
(Course: 5th Semester B.Tech Computer Science & Engineering) Tj
0 -20 Td
(Verified academic study notes shared on NoteHub College Portal.) Tj
0 -40 Td
/F1 10 Tf
(1. Introduction and Fundamental Concepts) Tj
0 -18 Td
(- Comprehensive theory, clear architectural diagrams, and memory representations.) Tj
0 -18 Td
(- Key formulas, algorithm time complexity breakdowns, and practical exam tips.) Tj
0 -25 Td
(2. Solved University Question Papers) Tj
0 -18 Td
(- Past 5-year repeated university questions with step-by-step solutions.) Tj
0 -18 Td
(- High scoring answers designed strictly in accordance with grading rubrics.) Tj
0 -30 Td
/F1 9 Tf
(Downloaded from NoteHub - College Notes Sharing Portal. For study purposes only.) Tj
ET`;

  const streamLength = Buffer.byteLength(contentStream);

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

  return Buffer.from(pdf, 'utf-8');
}

const seedDatabase = async () => {
  try {
    console.log('🌱 Connecting to database for seeding...');
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Note.deleteMany({});
    await Review.deleteMany({});
    await Report.deleteMany({});

    console.log('👥 Creating Users (Admin and Students)...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@college.edu',
      password: 'Admin123!',
      role: 'admin',
      college: 'National Institute of Technology',
      branch: 'Computer Science & Engineering',
      semester: 5,
    });

    const student1 = await User.create({
      name: 'John Doe',
      email: 'student@college.edu',
      password: 'Password123!',
      role: 'student',
      college: 'National Institute of Technology',
      branch: 'Computer Science & Engineering',
      semester: 5,
    });

    const student2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@college.edu',
      password: 'Password123!',
      role: 'student',
      college: 'National Institute of Technology',
      branch: 'Computer Science & Engineering',
      semester: 5,
    });

    const student3 = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@college.edu',
      password: 'Password123!',
      role: 'student',
      college: 'National Institute of Technology',
      branch: 'Information Technology',
      semester: 5,
    });

    console.log('📚 Creating Subjects...');
    const subjects = await Subject.insertMany([
      {
        name: 'Database Management System',
        code: 'CS501',
        semester: 5,
        branch: 'CSE',
        description: 'Relational model, SQL, normalization, concurrency control, and transactions.',
      },
      {
        name: 'Computer Networks',
        code: 'CS502',
        semester: 5,
        branch: 'CSE',
        description: 'OSI model, TCP/IP protocols, routing algorithms, socket programming, and network security.',
      },
      {
        name: 'Software Engineering',
        code: 'CS503',
        semester: 5,
        branch: 'CSE',
        description: 'Agile methodologies, SDLC models, UML design diagrams, testing, and maintenance.',
      },
      {
        name: 'Web Technology',
        code: 'CS504',
        semester: 5,
        branch: 'CSE',
        description: 'HTML5, CSS3, JavaScript modern ES6+, RESTful APIs, Node.js, and React architecture.',
      },
      {
        name: 'Operating Systems',
        code: 'CS401',
        semester: 4,
        branch: 'CSE',
        description: 'Process management, threads, scheduling algorithms, memory virtualization, and file systems.',
      },
      {
        name: 'Data Structures',
        code: 'CS301',
        semester: 3,
        branch: 'CSE',
        description: 'Linear & non-linear structures: arrays, linked lists, trees, heaps, and graph algorithms.',
      },
      {
        name: 'Object Oriented Programming',
        code: 'CS302',
        semester: 3,
        branch: 'CSE',
        description: 'Classes, encapsulation, inheritance, polymorphism, templates, and exception handling in Java/C++.',
      },
    ]);

    const subjectMap = {};
    subjects.forEach((s) => {
      subjectMap[s.code] = s;
    });

    console.log('📝 Creating Notes with Real PDF Files...');
    const notesData = [
      {
        title: 'DBMS Complete Unit 1 to 4 Handwritten Notes',
        description: 'Comprehensive handwritten notes covering ER Diagrams, Relational Algebra, BCNF Normalization, and ACID transaction schedules with solved university problems.',
        subjectCode: 'CS501',
        semester: 5,
        branch: 'CSE',
        tags: ['dbms', 'sql', 'normalization', 'handwritten', 'exam-prep'],
        uploader: student1,
        downloadCount: 42,
      },
      {
        title: 'Computer Networks - OSI & TCP/IP Model Summary',
        description: 'Concise summary with clear layered comparisons, header formats, IP addressing subnetting formulas, and routing protocol state diagrams.',
        subjectCode: 'CS502',
        semester: 5,
        branch: 'CSE',
        tags: ['networks', 'osi', 'tcp-ip', 'subnetting', 'cheat-sheet'],
        uploader: student2,
        downloadCount: 38,
      },
      {
        title: 'Operating Systems - Process Sync & Semaphores Guide',
        description: 'Deep dive into classic synchronization problems: Producer-Consumer, Dining Philosophers, Readers-Writers, Deadlock Banker Algorithm, and paging.',
        subjectCode: 'CS401',
        semester: 4,
        branch: 'CSE',
        tags: ['os', 'concurrency', 'semaphores', 'deadlock', 'memory'],
        uploader: student1,
        downloadCount: 55,
      },
      {
        title: 'Web Technology - Full Stack MERN Architecture Guide',
        description: 'Practical guide detailing client-server communication, React component lifecycle, Express routing, MongoDB aggregation pipelines, and JWT authentication.',
        subjectCode: 'CS504',
        semester: 5,
        branch: 'CSE',
        tags: ['mern', 'react', 'node', 'express', 'rest-api'],
        uploader: student3,
        downloadCount: 67,
      },
      {
        title: 'Data Structures - Binary Trees & Graph Traversal',
        description: 'Detailed analysis of BFS, DFS, Dijkstra shortest path, Kruskal MST, AVL Trees, and Dynamic Programming essentials with time & space complexity tables.',
        subjectCode: 'CS301',
        semester: 3,
        branch: 'CSE',
        tags: ['dsa', 'trees', 'graphs', 'algorithms', 'revision'],
        uploader: student2,
        downloadCount: 89,
      },
      {
        title: 'Software Engineering - Agile, Scrum & UML Diagrams',
        description: 'Complete guide to Use Case diagrams, Class diagrams, Sequence diagrams, Agile sprint planning, and black-box vs white-box software testing.',
        subjectCode: 'CS503',
        semester: 5,
        branch: 'CSE',
        tags: ['se', 'agile', 'scrum', 'uml', 'testing'],
        uploader: student1,
        downloadCount: 29,
      },
    ];

    const createdNotes = [];

    for (const item of notesData) {
      const subject = subjectMap[item.subjectCode];
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const filePath = path.join(uploadDir, filename);

      const pdfBuffer = createSamplePdfBuffer(item.title, subject.name, item.uploader.name);
      fs.writeFileSync(filePath, pdfBuffer);

      const note = await Note.create({
        title: item.title,
        description: item.description,
        subject: subject._id,
        semester: item.semester,
        branch: item.branch,
        tags: item.tags,
        fileUrl: filename,
        originalFileName: `${item.title}.pdf`,
        fileSize: pdfBuffer.length,
        uploadedBy: item.uploader._id,
        downloadCount: item.downloadCount,
      });

      createdNotes.push(note);
    }

    console.log('⭐ Creating Reviews and Ratings...');
    const reviewsData = [
      {
        note: createdNotes[0]._id,
        user: student2._id,
        rating: 5,
        comment: 'Extremely clear normalization steps! Helped me score an A in the mid-semester exam.',
      },
      {
        note: createdNotes[0]._id,
        user: student3._id,
        rating: 4,
        comment: 'Great diagrams and neat handwriting. A few more SQL query examples would make it perfect.',
      },
      {
        note: createdNotes[1]._id,
        user: student1._id,
        rating: 5,
        comment: 'Subnetting table made CIDR calculations so straightforward. 10/10 recommend!',
      },
      {
        note: createdNotes[2]._id,
        user: student2._id,
        rating: 5,
        comment: 'The explanation of semaphores with mutex code snippets cleared all my doubts.',
      },
      {
        note: createdNotes[3]._id,
        user: student1._id,
        rating: 5,
        comment: 'Super structured MERN stack guide. Exactly what we need for minor projects!',
      },
      {
        note: createdNotes[4]._id,
        user: student3._id,
        rating: 5,
        comment: 'Best tree traversal cheat sheet available on the portal. Saved me during lab practicals.',
      },
    ];

    for (const r of reviewsData) {
      await Review.create(r);
    }

    console.log('🚩 Creating Sample Report for Inappropriate Content Moderation...');
    await Report.create({
      note: createdNotes[5]._id,
      reportedBy: student3._id,
      reason: 'Contains outdated waterfall model diagrams from previous 2018 syllabus.',
      status: 'pending',
    });

    console.log('====================================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('====================================================');
    console.log('👤 Admin Account:    admin@college.edu    | Password: Admin123!');
    console.log('🎓 Student 1 Account: student@college.edu  | Password: Password123!');
    console.log('🎓 Student 2 Account: priya@college.edu    | Password: Password123!');
    console.log('🎓 Student 3 Account: rahul@college.edu    | Password: Password123!');
    console.log(`📚 Subjects Created:  ${subjects.length}`);
    console.log(`📝 Notes Created:     ${createdNotes.length}`);
    console.log(`⭐ Reviews Created:   ${reviewsData.length}`);
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
