import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import ProjectProposal from '../models/ProjectProposal.js';
import Project from '../models/Project.js';
import Document from '../models/Document.js';
import ProgressReport from '../models/ProgressReport.js';
import Feedback from '../models/Feedback.js';
import Review from '../models/Review.js';
import Attendance from '../models/Attendance.js';
import Evaluation from '../models/Evaluation.js';
import Workstream from '../models/Workstream.js';
import Milestone from '../models/Milestone.js';
import Task from '../models/Task.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import Settings from '../models/Settings.js';
import Counter from '../models/Counter.js';

const seedDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seed script cannot be run in production environment!');
    process.exit(1);
  }

  console.log('Connecting to MongoDB for ProjAxis Seeding...');
  await connectDB();

  console.log('Clearing existing database collections...');
  await mongoose.connection.dropDatabase();

  console.log('Initializing Default Settings & Academic Policies...');
  await Settings.create({
    collegeName: 'ProjAxis Institute of Technology',
    approvalMode: 'Guide + HOD',
    guideCapacityCap: 8,
    weeklyReportDeadlineDay: 'Sunday',
    weeklyReportDeadlineTime: '23:59',
    reviewTypes: ['Review 1', 'Review 2', 'Review 3', 'Final Viva', 'Guide Meeting'],
    rubric: [
      { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
      { criterion: 'Methodology & System Architecture', maxMarks: 10 },
      { criterion: 'Implementation & Technical Rigor', maxMarks: 10 },
      { criterion: 'Results, Testing & Validation', maxMarks: 10 },
      { criterion: 'Presentation & Q&A Response', maxMarks: 10 }
    ],
    gradeScale: [
      { grade: 'O', minPercentage: 90, maxPercentage: 100, description: 'Outstanding' },
      { grade: 'A+', minPercentage: 80, maxPercentage: 89.99, description: 'Excellent' },
      { grade: 'A', minPercentage: 70, maxPercentage: 79.99, description: 'Very Good' },
      { grade: 'B+', minPercentage: 60, maxPercentage: 69.99, description: 'Good' },
      { grade: 'B', minPercentage: 50, maxPercentage: 59.99, description: 'Above Average' },
      { grade: 'C', minPercentage: 40, maxPercentage: 49.99, description: 'Average' },
      { grade: 'Fail', minPercentage: 0, maxPercentage: 39.99, description: 'Fail' }
    ]
  });

  const defaultPassword = 'Password@123';
  const hashedPassword = await User.hashPassword(defaultPassword);

  // 1. Departments (4 fully active departments)
  console.log('Creating Academic Departments...');
  const deptCSE = await Department.create({
    name: 'Computer Science and Engineering',
    code: 'CSE',
    description: 'Department of Computer Science & Engineering - AI, Systems, & Software Engineering'
  });

  const deptECE = await Department.create({
    name: 'Electronics and Communication Engineering',
    code: 'ECE',
    description: 'Department of Electronics & Communication Engineering - Embedded Systems, VLSI & Signals'
  });

  const deptIT = await Department.create({
    name: 'Information Technology',
    code: 'IT',
    description: 'Department of Information Technology - Cloud Computing, Data Science & Cyber Security'
  });

  const deptMECH = await Department.create({
    name: 'Mechanical Engineering',
    code: 'MECH',
    description: 'Department of Mechanical Engineering - Thermal, Robotics & Electric Vehicle Systems'
  });

  // 2. Administrator
  console.log('Creating Institutional Administrator...');
  const admin = await User.create({
    userId: 'USR-0001',
    name: 'S. Rajagopalan',
    email: 'admin@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 94440 12345',
    roles: ['admin'],
    accountStatus: 'Active',
    mustChangePassword: false
  });

  // 3. Department HODs (All 4 Departments with South Indian names)
  console.log('Creating Department HODs...');
  const hodCSE = await User.create({
    userId: 'USR-0002',
    name: 'Dr. V. Balaji',
    email: 'hod.cse@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 98401 23456',
    roles: ['hod'],
    departmentId: deptCSE._id,
    accountStatus: 'Active',
    hod: { hodId: 'HOD-CSE-01', department: deptCSE.name }
  });

  const hodECE = await User.create({
    userId: 'USR-0003',
    name: 'Dr. S. Padmanabhan',
    email: 'hod.ece@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 98402 34567',
    roles: ['hod'],
    departmentId: deptECE._id,
    accountStatus: 'Active',
    hod: { hodId: 'HOD-ECE-01', department: deptECE.name }
  });

  const hodIT = await User.create({
    userId: 'USR-0004',
    name: 'Dr. R. Meenakshi Sundaram',
    email: 'hod.it@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 98403 45678',
    roles: ['hod'],
    departmentId: deptIT._id,
    accountStatus: 'Active',
    hod: { hodId: 'HOD-IT-01', department: deptIT.name }
  });

  const hodMECH = await User.create({
    userId: 'USR-0005',
    name: 'Dr. K. Sridharan',
    email: 'hod.mech@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 98404 56789',
    roles: ['hod'],
    departmentId: deptMECH._id,
    accountStatus: 'Active',
    hod: { hodId: 'HOD-MECH-01', department: deptMECH.name }
  });

  // 4. Faculty Guides with authentic South Indian names and clean emails
  console.log('Creating Faculty Guides across all 4 departments...');
  // CSE Guides
  const guide1 = await User.create({
    userId: 'USR-0006',
    name: 'Dr. R. Subramanian',
    email: 'guide.subramanian@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97901 11223',
    roles: ['guide'],
    departmentId: deptCSE._id,
    accountStatus: 'Active',
    guide: { facultyId: 'FAC-CSE-01', department: deptCSE.name }
  });

  const guide2 = await User.create({
    userId: 'USR-0007',
    name: 'Dr. Meera Krishnan',
    email: 'guide.meera@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97902 22334',
    roles: ['guide', 'panel'],
    departmentId: deptCSE._id,
    accountStatus: 'Active',
    guide: { facultyId: 'FAC-CSE-02', department: deptCSE.name },
    panel: { panelId: 'PNL-01', designation: 'Senior Faculty Evaluator' }
  });

  const guide4 = await User.create({
    userId: 'USR-0008',
    name: 'Dr. S. Ananthakrishnan',
    email: 'guide.ananth@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97904 44556',
    roles: ['guide'],
    departmentId: deptCSE._id,
    accountStatus: 'Active',
    guide: { facultyId: 'FAC-CSE-03', department: deptCSE.name }
  });

  // ECE Guides
  const guide3 = await User.create({
    userId: 'USR-0009',
    name: 'Dr. K. Venkataraman',
    email: 'guide.venkat@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97903 33445',
    roles: ['guide'],
    departmentId: deptECE._id,
    accountStatus: 'Active',
    guide: { facultyId: 'FAC-ECE-01', department: deptECE.name }
  });

  const guide6 = await User.create({
    userId: 'USR-0010',
    name: 'Dr. G. Soundararajan',
    email: 'guide.soundar@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97906 66778',
    roles: ['guide'],
    departmentId: deptECE._id,
    accountStatus: 'Active',
    guide: { facultyId: 'FAC-ECE-02', department: deptECE.name }
  });

  // IT Guides
  const guide5 = await User.create({
    userId: 'USR-0011',
    name: 'Dr. P. Muruganandam',
    email: 'guide.murugan@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97905 55667',
    roles: ['guide'],
    departmentId: deptIT._id,
    accountStatus: 'Active',
    guide: { facultyId: 'FAC-IT-01', department: deptIT.name }
  });

  const guide7 = await User.create({
    userId: 'USR-0012',
    name: 'Dr. M. Karthikeyan',
    email: 'guide.karthikeyan@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97907 88990',
    roles: ['guide'],
    departmentId: deptIT._id,
    accountStatus: 'Active',
    guide: { facultyId: 'FAC-IT-02', department: deptIT.name }
  });

  // MECH Guides
  const guide8 = await User.create({
    userId: 'USR-0013',
    name: 'Dr. A. Jayaraman',
    email: 'guide.jayaraman@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97908 12345',
    roles: ['guide'],
    departmentId: deptMECH._id,
    accountStatus: 'Active',
    guide: { facultyId: 'FAC-MECH-01', department: deptMECH.name }
  });

  const guide9 = await User.create({
    userId: 'USR-0014',
    name: 'Dr. N. Suresh Babu',
    email: 'guide.suresh@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97909 23456',
    roles: ['guide'],
    departmentId: deptMECH._id,
    accountStatus: 'Active',
    guide: { facultyId: 'FAC-MECH-02', department: deptMECH.name }
  });

  // Pending faculty registration (for testing approval workflow)
  await User.create({
    userId: 'USR-0015',
    name: 'Prof. T. Selvakumar',
    email: 'guide.pending@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97910 77889',
    roles: ['guide'],
    departmentId: deptCSE._id,
    accountStatus: 'Pending Approval',
    guide: { facultyId: 'FAC-CSE-04', department: deptCSE.name }
  });

  // Inactive faculty account (for testing filter & reactivation)
  await User.create({
    userId: 'USR-0016',
    name: 'Prof. N. Sivakumar',
    email: 'guide.inactive@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 97911 88990',
    roles: ['guide'],
    departmentId: deptCSE._id,
    accountStatus: 'Inactive',
    guide: { facultyId: 'FAC-CSE-05', department: deptCSE.name }
  });

  // 5. Review Panel Members (All with South Indian names & credentials)
  console.log('Creating Review Panel Members...');
  const panel2 = await User.create({
    userId: 'USR-0017',
    name: 'Dr. Radhakrishnan T.',
    email: 'panel.radhakrishnan@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 98840 12345',
    roles: ['panel'],
    departmentId: deptCSE._id,
    accountStatus: 'Active',
    panel: { panelId: 'PNL-02', designation: 'External Technical Expert' }
  });

  const panel3 = await User.create({
    userId: 'USR-0018',
    name: 'Dr. Revathi Senthilkumar',
    email: 'panel.revathi@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 98840 23456',
    roles: ['panel'],
    departmentId: deptCSE._id,
    accountStatus: 'Active',
    panel: { panelId: 'PNL-03', designation: 'Academic Review Committee Chair' }
  });

  const panel4 = await User.create({
    userId: 'USR-0019',
    name: 'Dr. C. Anandhan',
    email: 'panel.anandhan@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 98840 34567',
    roles: ['panel'],
    departmentId: deptIT._id,
    accountStatus: 'Active',
    panel: { panelId: 'PNL-04', designation: 'Industry Specialist' }
  });

  const panel5 = await User.create({
    userId: 'USR-0020',
    name: 'Dr. B. Vijayalakshmi',
    email: 'panel.vijayalakshmi@projaxis.edu',
    passwordHash: hashedPassword,
    phone: '+91 98840 45678',
    roles: ['panel'],
    departmentId: deptMECH._id,
    accountStatus: 'Active',
    panel: { panelId: 'PNL-05', designation: 'Senior Mechatronics Evaluator' }
  });

  // 6. Students across all departments (24 students with South Indian names)
  console.log('Creating Students across CSE, ECE, IT, and MECH...');
  const studentSpecs = [
    // CSE Students
    { name: 'Karthik Raman', email: 'student1@projaxis.edu', dept: deptCSE, regNo: '2022CSE0101' },
    { name: 'Ananya Sundaram', email: 'student2@projaxis.edu', dept: deptCSE, regNo: '2022CSE0102' },
    { name: 'Vigneshwaran K.', email: 'student3@projaxis.edu', dept: deptCSE, regNo: '2022CSE0103' },
    { name: 'Divya Balasubramanian', email: 'student4@projaxis.edu', dept: deptCSE, regNo: '2022CSE0104' },
    { name: 'Ashwin Kumar S.', email: 'student5@projaxis.edu', dept: deptCSE, regNo: '2022CSE0105' },
    { name: 'Keerthana R.', email: 'student6@projaxis.edu', dept: deptCSE, regNo: '2022CSE0106' },
    { name: 'Praveen Raj M.', email: 'student7@projaxis.edu', dept: deptCSE, regNo: '2022CSE0107' },
    { name: 'Harini Venkatesh', email: 'student10@projaxis.edu', dept: deptCSE, regNo: '2022CSE0108' },
    { name: 'Dinesh Karthik', email: 'student11@projaxis.edu', dept: deptCSE, regNo: '2022CSE0109' },
    { name: 'Lavanya Chandrasekar', email: 'student12@projaxis.edu', dept: deptCSE, regNo: '2022CSE0110' },
    { name: 'Naveen Prasad', email: 'student13@projaxis.edu', dept: deptCSE, regNo: '2022CSE0111' },
    { name: 'Gokulnath R.', email: 'student15@projaxis.edu', dept: deptCSE, regNo: '2022CSE0112' },

    // ECE Students
    { name: 'Meenakshi Natarajan', email: 'student8@projaxis.edu', dept: deptECE, regNo: '2022ECE0201' },
    { name: 'Saravanan M.', email: 'student9@projaxis.edu', dept: deptECE, regNo: '2022ECE0202' },
    { name: 'Pavithra Sundar', email: 'student14@projaxis.edu', dept: deptECE, regNo: '2022ECE0203' },
    { name: 'Manoj Prabhakar', email: 'student18@projaxis.edu', dept: deptECE, regNo: '2022ECE0204' },
    { name: 'Karthikeyan S.', email: 'student23@projaxis.edu', dept: deptECE, regNo: '2022ECE0205' },
    { name: 'Soundarya Lakshmi', email: 'student24@projaxis.edu', dept: deptECE, regNo: '2022ECE0206' },

    // IT Students
    { name: 'Sanjay Vaidyanathan', email: 'student16@projaxis.edu', dept: deptIT, regNo: '2022IT0301' },
    { name: 'Swetha Srinivasan', email: 'student17@projaxis.edu', dept: deptIT, regNo: '2022IT0302' },

    // MECH Students
    { name: 'Aditya Narayanan', email: 'student19@projaxis.edu', dept: deptMECH, regNo: '2022MECH0401' },
    { name: 'Siddharth Ramanathan', email: 'student20@projaxis.edu', dept: deptMECH, regNo: '2022MECH0402' },
    { name: 'K. Vignesh Raja', email: 'student21@projaxis.edu', dept: deptMECH, regNo: '2022MECH0403' },
    { name: 'Deepa Raghavan', email: 'student22@projaxis.edu', dept: deptMECH, regNo: '2022MECH0404' }
  ];

  const students = [];
  let userCounter = 21;
  for (const s of studentSpecs) {
    const studentUser = await User.create({
      userId: `USR-${String(userCounter++).padStart(4, '0')}`,
      name: s.name,
      email: s.email,
      passwordHash: hashedPassword,
      phone: `+91 9840${String(userCounter).padStart(5, '0')}`,
      roles: ['student'],
      departmentId: s.dept._id,
      accountStatus: 'Active',
      student: { regNo: s.regNo, semester: 8, department: s.dept.name }
    });
    students.push(studentUser);
  }

  // Helper map for students
  const sMap = {};
  students.forEach((st) => {
    sMap[st.email] = st;
  });

  // 7. Proposals across ALL Departments & Stages
  console.log('Seeding Comprehensive Proposals for all 4 Departments...');

  // PRP-0001: Approved -> PRJ-2026-CSE-001 (CSE Active)
  const propApproved1 = await ProjectProposal.create({
    proposalId: 'PRP-2026-0001',
    studentIds: [sMap['student1@projaxis.edu']._id, sMap['student2@projaxis.edu']._id],
    departmentId: deptCSE._id,
    title: 'Autonomous Drone Navigation Using Visual SLAM and Deep Reinforcement Learning',
    domain: 'Robotics & Computer Vision',
    description: 'Autonomous indoor navigation system for quadcopters using monocular visual simultaneous localization and mapping (vSLAM) combined with deep RL collision avoidance.',
    problemStatement: 'GPS-denied environments like collapsed mines, warehouses, and tunnels prevent drone localization.',
    objectives: 'Achieve sub-5cm trajectory tracking accuracy without GPS and avoid dynamic obstacles at 3m/s flight velocity.',
    methodology: 'ORB-SLAM3 integration with NVIDIA Jetson Orin Nano, ROS2 Humble, and simulated AirSim gazebo testbeds.',
    expectedOutcome: 'Functional autonomous flight controller prototype with obstacle avoidance demonstration.',
    mentorChoices: [guide1._id, guide2._id],
    assignedGuideId: guide1._id,
    submissionDate: new Date('2026-01-10'),
    approvalStatus: 'Approved',
    versions: [{
      versionNumber: 1,
      title: 'Autonomous Drone Navigation Using Visual SLAM',
      domain: 'Robotics & Computer Vision',
      problemStatement: 'GPS-denied environments prevent drone localization.',
      objectives: 'Sub-5cm trajectory tracking.',
      methodology: 'ORB-SLAM3 and ROS2.',
      expectedOutcome: 'Flight controller prototype.',
      submittedAt: new Date('2026-01-10')
    }],
    decisionHistory: [
      { by: sMap['student1@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-01-10') },
      { by: hodCSE._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. R. Subramanian for vision and robotics expertise', at: new Date('2026-01-12') },
      { by: guide1._id, role: 'guide', decision: 'Guide Approved', comments: 'Scope and mathematical formulation are well grounded.', at: new Date('2026-01-14') },
      { by: hodCSE._id, role: 'hod', decision: 'Approved', comments: 'Capstone topic sanctioned officially.', at: new Date('2026-01-15') }
    ]
  });

  // PRP-0002: Approved -> PRJ-2026-CSE-002 (CSE Final Submitted)
  const propApproved2 = await ProjectProposal.create({
    proposalId: 'PRP-2026-0002',
    studentIds: [sMap['student3@projaxis.edu']._id, sMap['student4@projaxis.edu']._id, sMap['student5@projaxis.edu']._id],
    departmentId: deptCSE._id,
    title: 'Decentralized Academic Credential Verification On Polygon Using Zero-Knowledge Proofs',
    domain: 'Blockchain & Cryptography',
    description: 'Privacy-preserving verification of university degree certificates using zk-SNARKs and Soulbound Non-Fungible Tokens (SBTs) on Ethereum L2.',
    problemStatement: 'Widespread certificate forgery and invasive third-party background checks compromising graduate privacy.',
    objectives: 'Enable instant cryptographic degree verification in under 2 seconds while preserving GPA privacy via zero-knowledge range proofs.',
    methodology: 'Circom circuits compiled to Groth16 zk-SNARK proofs verified by EVM smart contracts on Polygon Mumbai.',
    expectedOutcome: 'Production dApp with university issuer portal and employer verification dashboard.',
    mentorChoices: [guide2._id, guide4._id],
    assignedGuideId: guide2._id,
    submissionDate: new Date('2026-01-12'),
    approvalStatus: 'Approved',
    versions: [{
      versionNumber: 1,
      title: 'Decentralized Academic Credential Verification On Polygon',
      domain: 'Blockchain & Cryptography',
      problemStatement: 'Certificate forgery and slow verification.',
      objectives: 'Sub-2s zero-knowledge verification.',
      methodology: 'Circom zk-SNARKs and Polygon smart contracts.',
      expectedOutcome: 'Production dApp.',
      submittedAt: new Date('2026-01-12')
    }],
    decisionHistory: [
      { by: sMap['student3@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-01-12') },
      { by: hodCSE._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. Meera Krishnan', at: new Date('2026-01-13') },
      { by: guide2._id, role: 'guide', decision: 'Guide Approved', comments: 'Solid architecture and privacy considerations.', at: new Date('2026-01-15') },
      { by: hodCSE._id, role: 'hod', decision: 'Approved', comments: 'Topic approved.', at: new Date('2026-01-16') }
    ]
  });

  // PRP-0003: Approved -> PRJ-2026-CSE-003 (CSE Completed)
  const propApproved3 = await ProjectProposal.create({
    proposalId: 'PRP-2026-0003',
    studentIds: [sMap['student6@projaxis.edu']._id, sMap['student7@projaxis.edu']._id],
    departmentId: deptCSE._id,
    title: 'Edge-Computing Smart Irrigation System with LoRaWAN',
    domain: 'Internet of Things & Agriculture',
    description: 'Autonomous soil moisture sensing, evapotranspiration prediction, and drip irrigation scheduling via LoRa gateways.',
    problemStatement: 'Agricultural water wastage and inaccurate crop watering cycles in arid farming regions.',
    objectives: 'Reduce water consumption by 35% using microclimate predictive models on ESP32 microcontrollers.',
    methodology: 'LoRaWAN point-to-multipoint topology connected to ThingsBoard dashboard.',
    expectedOutcome: 'Field-deployed solar-powered irrigation controller node network.',
    mentorChoices: [guide4._id],
    assignedGuideId: guide4._id,
    submissionDate: new Date('2025-12-10'),
    approvalStatus: 'Approved',
    versions: [{
      versionNumber: 1,
      title: 'Edge-Computing Smart Irrigation System with LoRaWAN',
      domain: 'Internet of Things & Agriculture',
      problemStatement: 'Water wastage.',
      objectives: 'Predictive watering.',
      methodology: 'ESP32 & LoRaWAN.',
      expectedOutcome: 'Working controller.',
      submittedAt: new Date('2025-12-10')
    }],
    decisionHistory: [
      { by: sMap['student6@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2025-12-10') },
      { by: hodCSE._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. S. Ananthakrishnan', at: new Date('2025-12-12') },
      { by: guide4._id, role: 'guide', decision: 'Guide Approved', comments: 'Feasible deployment and strong societal relevance.', at: new Date('2025-12-15') },
      { by: hodCSE._id, role: 'hod', decision: 'Approved', comments: 'Topic sanctioned.', at: new Date('2025-12-18') }
    ]
  });

  // PRP-0004: Approved -> PRJ-2026-ECE-001 (ECE Active)
  const propApproved4 = await ProjectProposal.create({
    proposalId: 'PRP-2026-0004',
    studentIds: [sMap['student8@projaxis.edu']._id, sMap['student9@projaxis.edu']._id],
    departmentId: deptECE._id,
    title: 'FPGA-Accelerated Deep Learning for Real-Time Cardiac Arrhythmia Detection',
    domain: 'Biomedical Signal Processing & VLSI',
    description: 'Hardware synthesis of 1D Convolutional Neural Network on Xilinx Zynq-7000 SoC for instant ECG classification.',
    problemStatement: 'Latency and high power consumption in cloud-based cardiac patient telemetry.',
    objectives: 'Achieve 98.2% sensitivity for ventricular premature beats with sub-10ms inference latency.',
    methodology: 'Fixed-point 8-bit quantized CNN pipelined in Verilog RTL with AXI4 streaming interface.',
    expectedOutcome: 'Wearable ECG monitoring hardware module.',
    mentorChoices: [guide3._id, guide6._id],
    assignedGuideId: guide3._id,
    submissionDate: new Date('2026-01-14'),
    approvalStatus: 'Approved',
    versions: [{
      versionNumber: 1,
      title: 'FPGA-Accelerated Deep Learning for Real-Time Cardiac Arrhythmia Detection',
      domain: 'Biomedical Signal Processing & VLSI',
      problemStatement: 'High latency in cloud ECG analysis.',
      objectives: 'Sub-10ms hardware inference.',
      methodology: 'Verilog on Zynq SoC.',
      expectedOutcome: 'Hardware demonstration board.',
      submittedAt: new Date('2026-01-14')
    }],
    decisionHistory: [
      { by: sMap['student8@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-01-14') },
      { by: hodECE._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. K. Venkataraman for VLSI architecture', at: new Date('2026-01-16') },
      { by: guide3._id, role: 'guide', decision: 'Guide Approved', comments: 'Clear hardware pipelining strategy.', at: new Date('2026-01-18') },
      { by: hodECE._id, role: 'hod', decision: 'Approved', comments: 'Approved by ECE Head.', at: new Date('2026-01-20') }
    ]
  });

  // PRP-0005: Approved -> PRJ-2026-IT-001 (IT Under Evaluation)
  const propApproved5 = await ProjectProposal.create({
    proposalId: 'PRP-2026-0005',
    studentIds: [sMap['student16@projaxis.edu']._id, sMap['student17@projaxis.edu']._id],
    departmentId: deptIT._id,
    title: 'Cloud-Native Multi-Tenant Patient Health Record Exchange Platform',
    domain: 'Healthcare Informatics & Cloud Systems',
    description: 'HIPAA-compliant HL7-FHIR data exchange hub hosted on Kubernetes with end-to-end zero-knowledge encryption.',
    problemStatement: 'Interoperability silos between multi-specialty clinical hospital networks.',
    objectives: 'Process 10,000 FHIR transactions/sec with cryptographic audit logs.',
    methodology: 'Microservices architecture written in Go, deployed via Helm charts with Istio service mesh.',
    expectedOutcome: 'Cloud deployment with live synthetic patient EHR interchange portal.',
    mentorChoices: [guide5._id, guide7._id],
    assignedGuideId: guide5._id,
    submissionDate: new Date('2026-01-18'),
    approvalStatus: 'Approved',
    versions: [{
      versionNumber: 1,
      title: 'Cloud-Native Multi-Tenant Patient Health Record Exchange',
      domain: 'Cloud Systems',
      problemStatement: 'Clinical data silos.',
      objectives: 'High throughput FHIR exchange.',
      methodology: 'Go microservices and Kubernetes.',
      expectedOutcome: 'Cloud platform.',
      submittedAt: new Date('2026-01-18')
    }],
    decisionHistory: [
      { by: sMap['student16@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-01-18') },
      { by: hodIT._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. P. Muruganandam', at: new Date('2026-01-19') },
      { by: guide5._id, role: 'guide', decision: 'Guide Approved', comments: 'Robust HIPAA compliance model.', at: new Date('2026-01-21') },
      { by: hodIT._id, role: 'hod', decision: 'Approved', comments: 'Sanctioned.', at: new Date('2026-01-22') }
    ]
  });

  // PRP-0006: Approved -> PRJ-2026-MECH-001 (MECH Active!)
  const propApproved6 = await ProjectProposal.create({
    proposalId: 'PRP-2026-0006',
    studentIds: [sMap['student19@projaxis.edu']._id, sMap['student20@projaxis.edu']._id],
    departmentId: deptMECH._id,
    title: 'Autonomous Electric Vehicle Thermal Management and Regenerative Braking System',
    domain: 'Electric Vehicles & Mechatronics',
    description: 'Intelligent multi-channel liquid cooling thermal loop integrated with fuzzy logic regenerative braking controllers for commercial EV battery packs.',
    problemStatement: 'Thermal runaway risks during ultra-fast DC charging and braking energy dissipation loss in Indian city driving cycles.',
    objectives: 'Maintain lithium iron phosphate cell temperatures strictly between 25C and 38C while recapturing 24% additional braking energy.',
    methodology: '3D CFD simulation in ANSYS Fluent followed by physical bench dynamometer testing with STM32 motor drive inverters.',
    expectedOutcome: 'Fully instrumented hardware prototype testbed and real-time CAN bus telemetry dashboard.',
    mentorChoices: [guide8._id, guide9._id],
    assignedGuideId: guide8._id,
    submissionDate: new Date('2026-01-15'),
    approvalStatus: 'Approved',
    versions: [{
      versionNumber: 1,
      title: 'Autonomous Electric Vehicle Thermal Management and Regenerative Braking System',
      domain: 'Electric Vehicles & Mechatronics',
      problemStatement: 'Thermal runaway in EV battery packs and braking energy loss.',
      objectives: 'Cell temperature stabilization and 24% braking energy recovery.',
      methodology: 'ANSYS Fluent CFD modeling and STM32 inverter testbed.',
      expectedOutcome: 'Functional hardware test rig with CAN bus telemetry.',
      submittedAt: new Date('2026-01-15')
    }],
    decisionHistory: [
      { by: sMap['student19@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-01-15') },
      { by: hodMECH._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. A. Jayaraman for automotive and thermal systems expertise', at: new Date('2026-01-17') },
      { by: guide8._id, role: 'guide', decision: 'Guide Approved', comments: 'Excellent thermodynamic modeling and practical experimental plan.', at: new Date('2026-01-19') },
      { by: hodMECH._id, role: 'hod', decision: 'Approved', comments: 'Approved by Mechanical Engineering HOD.', at: new Date('2026-01-20') }
    ]
  });

  // PRP-0007: Approved -> PRJ-2026-MECH-002 (MECH Completed!)
  const propApproved7 = await ProjectProposal.create({
    proposalId: 'PRP-2026-0007',
    studentIds: [sMap['student21@projaxis.edu']._id, sMap['student22@projaxis.edu']._id],
    departmentId: deptMECH._id,
    title: 'Design and Analysis of Smart Aerodynamic Surfaces for Solar-Assisted Electric Vehicles',
    domain: 'Automotive Aerodynamics & Composite Materials',
    description: 'Active morphing aerodynamic surfaces using shape memory alloy actuators to optimize drag coefficient across varying highway speeds.',
    problemStatement: 'Fixed aerodynamic spoilers cause drag penalties at low speed and excessive battery discharge.',
    objectives: 'Reduce vehicle drag coefficient (Cd) from 0.28 to 0.21 above 80 km/h using adaptive carbon fiber aero-elements.',
    methodology: 'Wind tunnel validation of 1:4 scale vehicle prototype with digital pressure rake telemetry.',
    expectedOutcome: 'Fabricated active aerodynamic wing prototype with wind tunnel test validation data.',
    mentorChoices: [guide9._id],
    assignedGuideId: guide9._id,
    submissionDate: new Date('2025-12-15'),
    approvalStatus: 'Approved',
    versions: [{
      versionNumber: 1,
      title: 'Smart Aerodynamic Surfaces for Solar EVs',
      domain: 'Automotive Aerodynamics',
      problemStatement: 'Fixed spoiler drag penalties.',
      objectives: 'Drag reduction to Cd 0.21.',
      methodology: 'Wind tunnel test on 1:4 model.',
      expectedOutcome: 'Working prototype wing.',
      submittedAt: new Date('2025-12-15')
    }],
    decisionHistory: [
      { by: sMap['student21@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2025-12-15') },
      { by: hodMECH._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. N. Suresh Babu', at: new Date('2025-12-17') },
      { by: guide9._id, role: 'guide', decision: 'Guide Approved', comments: 'Impressive composite materials design.', at: new Date('2025-12-19') },
      { by: hodMECH._id, role: 'hod', decision: 'Approved', comments: 'Sanctioned.', at: new Date('2025-12-20') }
    ]
  });

  // PRP-0008: Approved -> PRJ-2026-ECE-002 (ECE Completed!)
  const propApproved8 = await ProjectProposal.create({
    proposalId: 'PRP-2026-0008',
    studentIds: [sMap['student23@projaxis.edu']._id, sMap['student24@projaxis.edu']._id],
    departmentId: deptECE._id,
    title: 'Sub-Terahertz Phased Array Antenna Array Design for 6G Backhaul',
    domain: 'RF & Microwave Engineering',
    description: 'Sub-terahertz 140 GHz 8x8 beam-steering antenna array fabricated on low-loss LTCC dielectric substrate.',
    problemStatement: 'Severe atmospheric attenuation at sub-THz frequencies limits 6G cellular backhaul range.',
    objectives: 'Demonstrate 22 dBi peak gain and +/- 45 degree electronic beam steering in azimuth plane.',
    methodology: 'Electromagnetic simulation in Ansys HFSS and vector network analyzer S-parameter measurements.',
    expectedOutcome: 'Fabricated 140 GHz patch antenna array module with far-field anechoic chamber radiation patterns.',
    mentorChoices: [guide6._id],
    assignedGuideId: guide6._id,
    submissionDate: new Date('2025-12-18'),
    approvalStatus: 'Approved',
    versions: [{
      versionNumber: 1,
      title: 'Sub-Terahertz Phased Array Antenna for 6G',
      domain: 'RF Engineering',
      problemStatement: 'Sub-THz atmospheric loss.',
      objectives: '22 dBi gain and beam steering.',
      methodology: 'Ansys HFSS and VNA testing.',
      expectedOutcome: 'Fabricated array board.',
      submittedAt: new Date('2025-12-18')
    }],
    decisionHistory: [
      { by: sMap['student23@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2025-12-18') },
      { by: hodECE._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. G. Soundararajan', at: new Date('2025-12-20') },
      { by: guide6._id, role: 'guide', decision: 'Guide Approved', comments: 'Rigorous electromagnetic formulation.', at: new Date('2025-12-22') },
      { by: hodECE._id, role: 'hod', decision: 'Approved', comments: 'Sanctioned.', at: new Date('2025-12-23') }
    ]
  });

  // Unapproved Proposals across ALL Pipeline Stages (Ensures NO Pipeline Stage is 0!)
  // PRP-0009: Submitted (Awaiting HOD guide assignment in CSE)
  await ProjectProposal.create({
    proposalId: 'PRP-2026-0009',
    studentIds: [sMap['student10@projaxis.edu']._id],
    departmentId: deptCSE._id,
    title: 'Deepfake Video Detection using Spatial-Temporal Vision Transformers',
    domain: 'Computer Vision & Deep Learning',
    description: 'Detecting facial boundary artifacts and unnatural blinking using ViT spatial features and LSTM temporal sequences.',
    problemStatement: 'Hyper-realistic video manipulation weaponized for identity theft and disinformation.',
    objectives: 'Attain AUC-ROC score > 0.96 on FaceForensics++ benchmark dataset.',
    methodology: 'Dual-stream convolutional and visual transformer architecture trained in PyTorch.',
    expectedOutcome: 'REST API service and browser extension for real-time video authenticity grading.',
    mentorChoices: [guide1._id, guide2._id],
    submissionDate: new Date('2026-02-18'),
    approvalStatus: 'Submitted',
    versions: [{
      versionNumber: 1,
      title: 'Deepfake Video Detection using Spatial-Temporal Transformers',
      domain: 'Computer Vision',
      problemStatement: 'Video manipulation and deepfakes.',
      objectives: 'AUC-ROC > 0.96.',
      methodology: 'PyTorch Vision Transformers.',
      expectedOutcome: 'Browser extension and API.',
      submittedAt: new Date('2026-02-18')
    }],
    decisionHistory: [
      { by: sMap['student10@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-02-18') }
    ]
  });

  // PRP-0010: Submitted (Awaiting HOD guide assignment in MECH)
  await ProjectProposal.create({
    proposalId: 'PRP-2026-0010',
    studentIds: [sMap['student21@projaxis.edu']._id],
    departmentId: deptMECH._id,
    title: 'Topology Optimization of 3D-Printed Titanium Drone Arms for High Payload Lift',
    domain: 'Additive Manufacturing & Solid Mechanics',
    description: 'Finite element density-based topology optimization to manufacture ultra-lightweight lattice structures for industrial logistics hexacopters.',
    problemStatement: 'Heavy aluminum frame structures diminish electric flight endurance and payload weight.',
    objectives: 'Reduce structural component mass by 42% while sustaining 3.5x factor of safety under peak motor thrust.',
    methodology: 'SIMP topology optimization in Abaqus coupled with Selective Laser Melting (SLM) metal 3D printing.',
    expectedOutcome: 'Destructive tensile-tested physical titanium arm specimen with FEA validation report.',
    mentorChoices: [guide8._id, guide9._id],
    submissionDate: new Date('2026-02-20'),
    approvalStatus: 'Submitted',
    versions: [{
      versionNumber: 1,
      title: 'Topology Optimization of 3D-Printed Titanium Drone Arms',
      domain: 'Additive Manufacturing',
      problemStatement: 'Excessive drone frame weight.',
      objectives: '42% mass reduction with 3.5x safety factor.',
      methodology: 'Abaqus SIMP and SLM 3D printing.',
      expectedOutcome: 'Tensile-tested titanium test piece.',
      submittedAt: new Date('2026-02-20')
    }],
    decisionHistory: [
      { by: sMap['student21@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-02-20') }
    ]
  });

  // PRP-0011: With Guide (Assigned to Dr. R. Subramanian in CSE, Guide Review Pending)
  await ProjectProposal.create({
    proposalId: 'PRP-2026-0011',
    studentIds: [sMap['student11@projaxis.edu']._id],
    departmentId: deptCSE._id,
    title: 'Microservices Observability and Distributed Tracing with eBPF',
    domain: 'Cloud Systems & Operating Systems',
    description: 'Kernel-level non-invasive packet inspection and tracing without modifying application byte-code or injecting sidecars.',
    problemStatement: 'Service mesh proxy overhead adds 15-20% CPU tax in large cloud microservices.',
    objectives: 'Extract L7 HTTP/gRPC metrics at zero application runtime cost.',
    methodology: 'Cilium eBPF programs written in C hooked into Linux kernel sockops.',
    expectedOutcome: 'Production tracing agent and Prometheus metrics exporter.',
    mentorChoices: [guide1._id],
    assignedGuideId: guide1._id,
    submissionDate: new Date('2026-02-15'),
    approvalStatus: 'With Guide',
    versions: [{
      versionNumber: 1,
      title: 'Microservices Observability with eBPF',
      domain: 'Cloud Systems',
      problemStatement: 'Service mesh overhead.',
      objectives: 'Kernel level tracing.',
      methodology: 'eBPF in Linux.',
      expectedOutcome: 'Observability agent.',
      submittedAt: new Date('2026-02-15')
    }],
    decisionHistory: [
      { by: sMap['student11@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-02-15') },
      { by: hodCSE._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. R. Subramanian for systems review', at: new Date('2026-02-16') }
    ]
  });

  // PRP-0012: With Guide (Assigned to Dr. A. Jayaraman in MECH, Guide Review Pending)
  await ProjectProposal.create({
    proposalId: 'PRP-2026-0012',
    studentIds: [sMap['student22@projaxis.edu']._id],
    departmentId: deptMECH._id,
    title: 'Design of Soft Pneumatic Gripper Mechanism for Agricultural Harvesting Robots',
    domain: 'Robotics & Bio-Inspired Mechanics',
    description: 'Elastomeric soft gripper fingers with embedded flex sensors for non-destructive tomato and strawberry plucking.',
    problemStatement: 'Rigid mechanical robot claws bruise delicate fruits during automated orchard harvesting.',
    objectives: 'Grasp fruits with gripping pressure under 12 kPa while sustaining 1.8 kg tensile pull force.',
    methodology: 'Non-linear hyperelastic Mooney-Rivlin silicone molding validated by pneumatic bench tester.',
    expectedOutcome: 'Pneumatically controlled four-finger end-effector mounted on 6-DOF robotic manipulator.',
    mentorChoices: [guide8._id],
    assignedGuideId: guide8._id,
    submissionDate: new Date('2026-02-16'),
    approvalStatus: 'With Guide',
    versions: [{
      versionNumber: 1,
      title: 'Soft Pneumatic Gripper for Harvesting Robots',
      domain: 'Robotics & Bio-Inspired Mechanics',
      problemStatement: 'Fruit damage during harvesting.',
      objectives: 'Gripping pressure below 12 kPa.',
      methodology: 'Silicone casting and pneumatic testing.',
      expectedOutcome: 'Working soft gripper.',
      submittedAt: new Date('2026-02-16')
    }],
    decisionHistory: [
      { by: sMap['student22@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-02-16') },
      { by: hodMECH._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. A. Jayaraman', at: new Date('2026-02-17') }
    ]
  });

  // PRP-0013: Guide Approved (Approved by Dr. Meera Krishnan, Awaiting HOD Final Topic Sanction!)
  await ProjectProposal.create({
    proposalId: 'PRP-2026-0013',
    studentIds: [sMap['student12@projaxis.edu']._id],
    departmentId: deptCSE._id,
    title: 'Automated Diabetic Retinopathy Grading from Retinal Fundus Images',
    domain: 'Healthcare AI & Image Processing',
    description: 'Multi-stage ensemble of EfficientNet and ConvNeXt to detect microaneurysms and hemorrhages across 5 clinical severity levels.',
    problemStatement: 'Shortage of trained ophthalmologists in rural primary health centers causes delayed intervention.',
    objectives: 'Achieve quadratic weighted kappa score > 0.88 on Messidor-2 dataset.',
    methodology: 'Image normalization, CLAHE enhancement, and focal loss training with explainable Grad-CAM heatmaps.',
    expectedOutcome: 'Web-based clinical decision support tool for screening ophthalmologists.',
    mentorChoices: [guide2._id],
    assignedGuideId: guide2._id,
    submissionDate: new Date('2026-02-14'),
    approvalStatus: 'Guide Approved',
    versions: [{
      versionNumber: 1,
      title: 'Automated Diabetic Retinopathy Grading from Retinal Images',
      domain: 'Healthcare AI',
      problemStatement: 'Rural screening bottleneck.',
      objectives: 'Kappa score > 0.88.',
      methodology: 'ConvNeXt ensemble and Grad-CAM.',
      expectedOutcome: 'Diagnostic web tool.',
      submittedAt: new Date('2026-02-14')
    }],
    decisionHistory: [
      { by: sMap['student12@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-02-14') },
      { by: hodCSE._id, role: 'hod', decision: 'Guide Assigned', comments: 'Assigned to Dr. Meera Krishnan', at: new Date('2026-02-15') },
      { by: guide2._id, role: 'guide', decision: 'Guide Approved', comments: 'Clinical methodology and dataset validation are well justified. Recommended for final HOD topic approval.', at: new Date('2026-02-17') }
    ]
  });

  // PRP-0014: Revision Required
  await ProjectProposal.create({
    proposalId: 'PRP-2026-0014',
    studentIds: [sMap['student14@projaxis.edu']._id],
    departmentId: deptECE._id,
    title: 'Smart Helmet with Alcohol Detection and Crash Alert System',
    domain: 'Embedded Systems & IoT',
    description: 'Microcontroller helmet that prevents motorcycle ignition upon detecting breath alcohol levels over the legal threshold.',
    problemStatement: 'Motorcycle accidents caused by drunk driving.',
    objectives: 'Prevent bike startup and send GPS coordinates over SMS upon helmet impact.',
    methodology: 'MQ-3 alcohol sensor, piezo vibration sensor, and GSM SIM800L module.',
    expectedOutcome: 'Demonstration helmet prototype with relay ignition lockout.',
    mentorChoices: [guide3._id],
    assignedGuideId: guide3._id,
    submissionDate: new Date('2026-02-11'),
    approvalStatus: 'Revision Required',
    versions: [{
      versionNumber: 1,
      title: 'Smart Helmet with Alcohol Detection',
      domain: 'Embedded Systems',
      problemStatement: 'Drunk driving accidents.',
      objectives: 'Ignition cutoff on alcohol detection.',
      methodology: 'Arduino, MQ-3 sensor, GSM module.',
      expectedOutcome: 'Helmet prototype.',
      submittedAt: new Date('2026-02-11')
    }],
    decisionHistory: [
      { by: sMap['student14@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-02-11') },
      { by: hodECE._id, role: 'hod', decision: 'Guide Assigned', at: new Date('2026-02-12') },
      { by: guide3._id, role: 'guide', decision: 'Revision Required', comments: 'This topic has been submitted frequently in previous academic years. To be accepted as an accredited capstone, you must upgrade the technical rigor: incorporate Bluetooth Low Energy (BLE) secure pairing with the vehicle dashboard, integrate an accelerometer-based machine learning fall detection classifier to prevent false alarms, and use an automotive-grade MCU rather than basic hobbyist modules. Please revise and resubmit.', at: new Date('2026-02-13') }
    ]
  });

  // PRP-0015: Rejected (Ethical/Scope Violation)
  await ProjectProposal.create({
    proposalId: 'PRP-2026-0015',
    studentIds: [sMap['student15@projaxis.edu']._id],
    departmentId: deptCSE._id,
    title: 'High-Frequency Algorithmic Crypto Arbitrage Bot with Telegram Signals',
    domain: 'FinTech & Scraping',
    description: 'Automated crypto trading bot executing cross-exchange arbitrage across Binance and Uniswap using leaked Telegram group buy signals.',
    problemStatement: 'Manual trading suffers from human reaction latency in volatile cryptocurrency tokens.',
    objectives: 'Auto-trade without human intervention and generate guaranteed daily profits.',
    methodology: 'Python script with Telegram scraping.',
    expectedOutcome: 'Trading script.',
    mentorChoices: [guide4._id],
    assignedGuideId: guide4._id,
    submissionDate: new Date('2026-02-10'),
    approvalStatus: 'Rejected',
    versions: [{
      versionNumber: 1,
      title: 'High Frequency Algorithmic Crypto Arbitrage Bot',
      domain: 'FinTech',
      problemStatement: 'Arbitrage opportunity.',
      objectives: 'Trading bot.',
      methodology: 'Telegram scraping.',
      expectedOutcome: 'Script.',
      submittedAt: new Date('2026-02-10')
    }],
    decisionHistory: [
      { by: sMap['student15@projaxis.edu']._id, role: 'student', decision: 'Submitted', at: new Date('2026-02-10') },
      { by: hodCSE._id, role: 'hod', decision: 'Guide Assigned', at: new Date('2026-02-11') },
      { by: guide4._id, role: 'guide', decision: 'Rejected', comments: 'Proposal rejected. The proposed trading script violates institutional academic ethics standards and lacks scholarly engineering rigor. Please choose an accredited engineering problem.', at: new Date('2026-02-12') }
    ]
  });

  // PRP-0016: Draft
  await ProjectProposal.create({
    proposalId: 'PRP-2026-0016',
    studentIds: [sMap['student13@projaxis.edu']._id],
    departmentId: deptCSE._id,
    title: 'Distributed Fault-Tolerant File System with Paxos Consensus',
    domain: 'Distributed Systems & Cloud Storage',
    description: 'Building a chunked, replicated object storage cluster inspired by Google File System in Rust.',
    problemStatement: 'Server node failure in storage clusters requires automated quorum recovery.',
    objectives: 'Implement multi-Paxos replication with chunk checksumming.',
    methodology: 'Rust with Tokio asynchronous runtime.',
    expectedOutcome: 'CLI client and storage server daemon.',
    mentorChoices: [guide1._id],
    approvalStatus: 'Draft'
  });

  // 8. Projects across all 4 departments (CSE, ECE, IT, MECH)
  console.log('Seeding Comprehensive Projects across CSE, ECE, IT, and MECH...');

  const project1 = await Project.create({
    projectId: 'PRJ-2026-CSE-001',
    proposalId: propApproved1._id,
    studentIds: [sMap['student1@projaxis.edu']._id, sMap['student2@projaxis.edu']._id],
    guideId: guide1._id,
    departmentId: deptCSE._id,
    title: 'Autonomous Drone Navigation Using Visual SLAM and Deep Reinforcement Learning',
    domain: 'Robotics & Computer Vision',
    description: 'Autonomous indoor navigation system for quadcopters using monocular visual simultaneous localization and mapping (vSLAM) combined with deep RL collision avoidance.',
    status: 'Active',
    startDate: new Date('2026-01-15'),
    academicYear: '2025-2026'
  });

  const project2 = await Project.create({
    projectId: 'PRJ-2026-CSE-002',
    proposalId: propApproved2._id,
    studentIds: [sMap['student3@projaxis.edu']._id, sMap['student4@projaxis.edu']._id],
    guideId: guide2._id,
    departmentId: deptCSE._id,
    title: 'Federated Learning Framework with Differential Privacy for Electronic Health Records',
    domain: 'Privacy-Preserving AI & Healthcare',
    description: 'Decentralized deep learning architecture preserving clinical privacy across disparate hospital consortia with formal (epsilon, delta) differential privacy guarantees.',
    status: 'Final Submitted',
    startDate: new Date('2025-12-20'),
    academicYear: '2025-2026'
  });

  const project3 = await Project.create({
    projectId: 'PRJ-2026-CSE-003',
    proposalId: propApproved3._id,
    studentIds: [sMap['student6@projaxis.edu']._id, sMap['student7@projaxis.edu']._id],
    guideId: guide4._id,
    departmentId: deptCSE._id,
    title: 'Smart Waste Segregation and Real-Time Bin Overflow Forecasting using Edge AI & IoT',
    domain: 'IoT & Smart City Infrastructure',
    description: 'Autonomous multi-spectral sorting trash bin combining computer vision detection and LoRaWAN fill-level telemetry.',
    status: 'Completed',
    startDate: new Date('2025-11-01'),
    endDate: new Date('2026-02-15'),
    academicYear: '2025-2026'
  });

  const project4 = await Project.create({
    projectId: 'PRJ-2026-ECE-001',
    proposalId: propApproved4._id,
    studentIds: [sMap['student8@projaxis.edu']._id, sMap['student9@projaxis.edu']._id],
    guideId: guide3._id,
    departmentId: deptECE._id,
    title: 'FPGA-Accelerated Deep Learning for Real-Time Cardiac Arrhythmia Detection',
    domain: 'Biomedical Signal Processing & VLSI',
    description: 'Hardware synthesis of 1D Convolutional Neural Network on Xilinx Zynq-7000 SoC for instant ECG classification.',
    status: 'Active',
    startDate: new Date('2026-01-20'),
    academicYear: '2025-2026'
  });

  const project5 = await Project.create({
    projectId: 'PRJ-2026-IT-001',
    proposalId: propApproved5._id,
    studentIds: [sMap['student16@projaxis.edu']._id, sMap['student17@projaxis.edu']._id],
    guideId: guide5._id,
    departmentId: deptIT._id,
    title: 'Cloud-Native Multi-Tenant Patient Health Record Exchange Platform',
    domain: 'Healthcare Informatics & Cloud Systems',
    description: 'HIPAA-compliant HL7-FHIR data exchange hub hosted on Kubernetes with end-to-end zero-knowledge encryption.',
    status: 'Under Evaluation',
    startDate: new Date('2026-01-22'),
    academicYear: '2025-2026'
  });

  const project6 = await Project.create({
    projectId: 'PRJ-2026-MECH-001',
    proposalId: propApproved6._id,
    studentIds: [sMap['student19@projaxis.edu']._id, sMap['student20@projaxis.edu']._id],
    guideId: guide8._id,
    departmentId: deptMECH._id,
    title: 'Autonomous Electric Vehicle Thermal Management and Regenerative Braking System',
    domain: 'Electric Vehicles & Mechatronics',
    description: 'Intelligent multi-channel liquid cooling thermal loop integrated with fuzzy logic regenerative braking controllers for commercial EV battery packs.',
    status: 'Active',
    startDate: new Date('2026-01-20'),
    academicYear: '2025-2026'
  });

  const project7 = await Project.create({
    projectId: 'PRJ-2026-MECH-002',
    proposalId: propApproved7._id,
    studentIds: [sMap['student21@projaxis.edu']._id, sMap['student22@projaxis.edu']._id],
    guideId: guide9._id,
    departmentId: deptMECH._id,
    title: 'Design and Analysis of Smart Aerodynamic Surfaces for Solar-Assisted Electric Vehicles',
    domain: 'Automotive Aerodynamics & Composite Materials',
    description: 'Active morphing aerodynamic surfaces using shape memory alloy actuators to optimize drag coefficient across varying highway speeds.',
    status: 'Completed',
    startDate: new Date('2025-11-15'),
    endDate: new Date('2026-02-10'),
    academicYear: '2025-2026'
  });

  const project8 = await Project.create({
    projectId: 'PRJ-2026-ECE-002',
    proposalId: propApproved8._id,
    studentIds: [sMap['student23@projaxis.edu']._id, sMap['student24@projaxis.edu']._id],
    guideId: guide6._id,
    departmentId: deptECE._id,
    title: 'Sub-Terahertz Phased Array Antenna Array Design for 6G Backhaul',
    domain: 'RF & Microwave Engineering',
    description: 'Sub-terahertz 140 GHz 8x8 beam-steering antenna array fabricated on low-loss LTCC dielectric substrate.',
    status: 'Completed',
    startDate: new Date('2025-11-20'),
    endDate: new Date('2026-02-12'),
    academicYear: '2025-2026'
  });

  // Workstreams
  console.log('Seeding Workstreams & Milestones...');
  const ws1_1 = await Workstream.create({
    workstreamId: `WS-${project1._id}-1`,
    projectId: project1._id,
    title: 'Perception & Visual SLAM Pipeline',
    description: 'Stereo camera driver, feature matching, and real-time state estimation.',
    order: 1,
    status: 'Open'
  });
  const ws1_2 = await Workstream.create({
    workstreamId: `WS-${project1._id}-2`,
    projectId: project1._id,
    title: 'Embedded Jetson Edge Optimization',
    description: 'TensorRT FP16 quantization and CUDA memory sharing.',
    order: 2,
    status: 'Open'
  });
  const ws1_3 = await Workstream.create({
    workstreamId: `WS-${project1._id}-3`,
    projectId: project1._id,
    title: 'Flight Controller Interface',
    description: 'PX4 MAVROS bridge and trajectory command generation.',
    order: 3,
    status: 'Open'
  });

  const ws6_1 = await Workstream.create({
    workstreamId: `WS-${project6._id}-1`,
    projectId: project6._id,
    title: 'Thermal CFD Simulation & Jacket Design',
    description: 'ANSYS Fluent heat transfer modeling and serpentine flow channel geometry.',
    order: 1,
    status: 'Open'
  });
  const ws6_2 = await Workstream.create({
    workstreamId: `WS-${project6._id}-2`,
    projectId: project6._id,
    title: 'STM32 Motor Inverter & CAN Telemetry',
    description: 'Firmware design for real-time CAN bus data acquisition and fuzzy logic brake control.',
    order: 2,
    status: 'Open'
  });

  // Milestones
  const ms1_1 = await Milestone.create({
    milestoneId: `MS-${project1._id}-1`,
    projectId: project1._id,
    title: 'Architecture Specification & ROS2 Setup',
    description: 'Complete system architecture document and development container validation.',
    dueDate: new Date('2026-01-30'),
    status: 'Achieved',
    achievedAt: new Date('2026-01-28')
  });
  const ms1_2 = await Milestone.create({
    milestoneId: `MS-${project1._id}-2`,
    projectId: project1._id,
    title: 'Stereo VIO Deployment on Jetson',
    description: 'Running visual-inertial odometry at 30 fps with sub-10cm drift.',
    dueDate: new Date('2026-02-20'),
    status: 'Achieved',
    achievedAt: new Date('2026-02-19')
  });
  const ms1_3 = await Milestone.create({
    milestoneId: `MS-${project1._id}-3`,
    projectId: project1._id,
    title: 'Autonomous Waypoint Navigation in Indoor Maze',
    description: 'Complete flight through GPS-denied obstacle corridor without manual intervention.',
    dueDate: new Date('2026-03-30'),
    status: 'Pending'
  });
  const ms1_4 = await Milestone.create({
    milestoneId: `MS-${project1._id}-4`,
    projectId: project1._id,
    title: 'Final Defense & Capstone Demonstration',
    description: 'Viva presentation and live demonstration before institutional evaluation committee.',
    dueDate: new Date('2026-04-25'),
    status: 'Pending'
  });

  const ms6_1 = await Milestone.create({
    milestoneId: `MS-${project6._id}-1`,
    projectId: project6._id,
    title: 'Battery Pack Thermal Characterization & CFD Mesh',
    description: 'Simulating heat flux across 16-cell LiFePO4 pack under 3C fast charge cycle.',
    dueDate: new Date('2026-02-05'),
    status: 'Achieved',
    achievedAt: new Date('2026-02-04')
  });
  const ms6_2 = await Milestone.create({
    milestoneId: `MS-${project6._id}-2`,
    projectId: project6._id,
    title: 'Liquid Cooling Cold Plate Fabrication',
    description: 'CNC milling and pressure testing aluminum cold plate with ethylene glycol coolant.',
    dueDate: new Date('2026-02-28'),
    status: 'Achieved',
    achievedAt: new Date('2026-02-27')
  });
  const ms6_3 = await Milestone.create({
    milestoneId: `MS-${project6._id}-3`,
    projectId: project6._id,
    title: 'Dynamometer Regenerative Braking Validation',
    description: 'Hardware bench testing of braking energy recuperation across Indian urban drive cycles.',
    dueDate: new Date('2026-04-10'),
    status: 'Pending'
  });
  const ms6_4 = await Milestone.create({
    milestoneId: `MS-${project6._id}-4`,
    projectId: project6._id,
    title: 'Final Technical Defense & Report Submission',
    description: 'Comprehensive mechanical capstone viva defense.',
    dueDate: new Date('2026-05-02'),
    status: 'Pending'
  });

  // Tasks
  console.log('Seeding Kanban Board Tasks across all statuses & departments...');
  const task1_1 = await Task.create({
    taskId: 'TSK-0001',
    projectId: project1._id,
    title: 'Setup ROS2 Humble and Jetson Orin Nano Flashing',
    description: 'Flash JetPack 5.1.2 onto Jetson Orin Nano with CUDA, cuDNN, and ROS2 Humble desktop.',
    assigneeId: sMap['student1@projaxis.edu']._id,
    createdBy: guide1._id,
    priority: 'High',
    status: 'Done',
    startDate: new Date('2026-01-16'),
    dueDate: new Date('2026-01-25'),
    completedAt: new Date('2026-01-24'),
    workstreamId: ws1_2._id,
    milestoneId: ms1_1._id
  });

  const task1_2 = await Task.create({
    taskId: 'TSK-0002',
    projectId: project1._id,
    title: 'Calibrate RealSense D435i IMU and Stereo Camera Intrinsics',
    description: 'Run Kalibr tool to obtain camera-IMU spatial transformation matrix and distortion parameters.',
    assigneeId: sMap['student2@projaxis.edu']._id,
    createdBy: guide1._id,
    priority: 'Highest',
    status: 'Done',
    startDate: new Date('2026-01-20'),
    dueDate: new Date('2026-01-28'),
    completedAt: new Date('2026-01-27'),
    workstreamId: ws1_1._id,
    milestoneId: ms1_1._id
  });

  const task1_3 = await Task.create({
    taskId: 'TSK-0003',
    projectId: project1._id,
    title: 'Benchmark OpenVINS Tracking Drift on EuRoC MAV Dataset',
    description: 'Evaluate translational and rotational root-mean-squared error against ground truth Vicon motion capture.',
    assigneeId: sMap['student1@projaxis.edu']._id,
    createdBy: sMap['student1@projaxis.edu']._id,
    priority: 'Medium',
    status: 'Done',
    startDate: new Date('2026-01-29'),
    dueDate: new Date('2026-02-18'),
    completedAt: new Date('2026-02-17'),
    workstreamId: ws1_1._id,
    milestoneId: ms1_2._id
  });

  const task1_4 = await Task.create({
    taskId: 'TSK-0004',
    projectId: project1._id,
    title: 'Implement OctoMap 3D Occupancy Grid Mapping over ROS2 Topic',
    description: 'Subscribe to disparity point cloud and construct real-time probabilistic 3D voxel map for collision avoidance.',
    assigneeId: sMap['student1@projaxis.edu']._id,
    createdBy: sMap['student1@projaxis.edu']._id,
    priority: 'High',
    status: 'In Progress',
    startDate: new Date('2026-02-18'),
    dueDate: new Date('2026-03-15'),
    workstreamId: ws1_1._id,
    milestoneId: ms1_3._id
  });

  const task1_5 = await Task.create({
    taskId: 'TSK-0005',
    projectId: project1._id,
    title: 'PX4 Autopilot MAVLink Offboard Trajectory Bridge',
    description: 'Bridge high-level position setpoints from ROS2 planner to PX4 attitude control loop over UART telem port.',
    assigneeId: sMap['student2@projaxis.edu']._id,
    createdBy: sMap['student2@projaxis.edu']._id,
    priority: 'Highest',
    status: 'In Progress',
    startDate: new Date('2026-02-20'),
    dueDate: new Date('2026-03-20'),
    workstreamId: ws1_3._id,
    milestoneId: ms1_3._id
  });

  const task1_6 = await Task.create({
    taskId: 'TSK-0006',
    projectId: project1._id,
    title: 'TensorRT Quantization for YOLOv8 Tiny Obstacle Detection',
    description: 'Export PyTorch weights to ONNX and build INT8 engine with calibration cache for 60 fps inference on Jetson.',
    assigneeId: sMap['student2@projaxis.edu']._id,
    createdBy: sMap['student2@projaxis.edu']._id,
    priority: 'Medium',
    status: 'Under Review',
    startDate: new Date('2026-02-22'),
    dueDate: new Date('2026-03-10'),
    workstreamId: ws1_2._id,
    milestoneId: ms1_3._id
  });

  const task1_7 = await Task.create({
    taskId: 'TSK-0007',
    projectId: project1._id,
    title: 'Emergency Failsafe Return-to-Home Behavior on Optical Loss',
    description: 'Trigger autonomous hover and climb if visual tracking confidence metric drops below 40% for > 500ms.',
    assigneeId: sMap['student1@projaxis.edu']._id,
    createdBy: guide1._id,
    priority: 'High',
    status: 'To Do',
    startDate: new Date('2026-03-05'),
    dueDate: new Date('2026-03-28'),
    workstreamId: ws1_3._id,
    milestoneId: ms1_3._id
  });

  const task1_8 = await Task.create({
    taskId: 'TSK-0008',
    projectId: project1._id,
    title: 'Capstone Demonstration Flight Plan Rehearsal',
    description: 'Execute full 5-minute autonomous mission in campus gymnasium with artificial corridors and obstacles.',
    assigneeId: sMap['student2@projaxis.edu']._id,
    createdBy: guide1._id,
    priority: 'Medium',
    status: 'To Do',
    startDate: new Date('2026-04-01'),
    dueDate: new Date('2026-04-20'),
    milestoneId: ms1_4._id
  });

  const task1_9 = await Task.create({
    taskId: 'TSK-0009',
    projectId: project1._id,
    title: 'Carbon Fiber Airframe Vibration Damping Mounts',
    description: 'Source 3D printed TPU vibration isolation grommets for flight controller gyro dampening.',
    assigneeId: sMap['student1@projaxis.edu']._id,
    createdBy: sMap['student1@projaxis.edu']._id,
    priority: 'Low',
    status: 'Blocked',
    startDate: new Date('2026-02-25'),
    dueDate: new Date('2026-03-12'),
    workstreamId: ws1_3._id
  });

  // Project 6 (MECH) Tasks
  const task6_1 = await Task.create({
    taskId: 'TSK-0010',
    projectId: project6._id,
    title: 'SolidWorks 3D CAD of 16-Cell LiFePO4 Battery Pack Enclosure',
    description: 'Design structural aluminum housing with IP67 sealing and internal vibration isolator channels.',
    assigneeId: sMap['student19@projaxis.edu']._id,
    createdBy: guide8._id,
    priority: 'High',
    status: 'Done',
    startDate: new Date('2026-01-22'),
    dueDate: new Date('2026-02-04'),
    completedAt: new Date('2026-02-03'),
    workstreamId: ws6_1._id,
    milestoneId: ms6_1._id
  });

  const task6_2 = await Task.create({
    taskId: 'TSK-0011',
    projectId: project6._id,
    title: 'ANSYS Fluent Heat Generation and CFD Thermal Simulation',
    description: 'Simulate temperature contours and velocity vectors of 50:50 water-glycol coolant under 150A fast discharge.',
    assigneeId: sMap['student20@projaxis.edu']._id,
    createdBy: guide8._id,
    priority: 'Highest',
    status: 'Done',
    startDate: new Date('2026-01-25'),
    dueDate: new Date('2026-02-15'),
    completedAt: new Date('2026-02-14'),
    workstreamId: ws6_1._id,
    milestoneId: ms6_1._id
  });

  const task6_3 = await Task.create({
    taskId: 'TSK-0012',
    projectId: project6._id,
    title: 'CNC Machining of Aluminum Serpentine Cold Plate',
    description: 'Machine micro-channel cooling plate from 6061-T6 aluminum block and laser-weld upper cover plate.',
    assigneeId: sMap['student19@projaxis.edu']._id,
    createdBy: sMap['student19@projaxis.edu']._id,
    priority: 'High',
    status: 'In Progress',
    startDate: new Date('2026-02-15'),
    dueDate: new Date('2026-03-18'),
    workstreamId: ws6_1._id,
    milestoneId: ms6_2._id
  });

  const task6_4 = await Task.create({
    taskId: 'TSK-0013',
    projectId: project6._id,
    title: 'STM32F4 CAN Bus Telemetry and Temperature Sensor Interface',
    description: 'Implement CAN 2.0B transceiver driver at 500 kbps to stream 16 digital temperature sensor values to BMS.',
    assigneeId: sMap['student20@projaxis.edu']._id,
    createdBy: sMap['student20@projaxis.edu']._id,
    priority: 'High',
    status: 'In Progress',
    startDate: new Date('2026-02-18'),
    dueDate: new Date('2026-03-22'),
    workstreamId: ws6_2._id,
    milestoneId: ms6_2._id
  });

  const task6_5 = await Task.create({
    taskId: 'TSK-0014',
    projectId: project6._id,
    title: 'Fuzzy Logic Regenerative Braking Model in MATLAB Simulink',
    description: 'Develop regenerative braking torque split controller based on vehicle speed, state of charge, and pedal travel.',
    assigneeId: sMap['student20@projaxis.edu']._id,
    createdBy: guide8._id,
    priority: 'Medium',
    status: 'Under Review',
    startDate: new Date('2026-02-20'),
    dueDate: new Date('2026-03-15'),
    workstreamId: ws6_2._id,
    milestoneId: ms6_3._id
  });

  const task6_6 = await Task.create({
    taskId: 'TSK-0015',
    projectId: project6._id,
    title: 'Thermal Runaway Containment Chamber Safety Testing',
    description: 'Subject dummy cells to thermal overstress and verify safety valve pressure discharge vent operation.',
    assigneeId: sMap['student19@projaxis.edu']._id,
    createdBy: guide8._id,
    priority: 'High',
    status: 'To Do',
    startDate: new Date('2026-03-10'),
    dueDate: new Date('2026-04-05'),
    workstreamId: ws6_1._id,
    milestoneId: ms6_3._id
  });

  // Project 4 (ECE) Tasks
  await Task.create({
    taskId: 'TSK-0016',
    projectId: project4._id,
    title: 'Fixed-Point 8-bit Quantization of 1D CNN Architecture',
    description: 'Quantize PyTorch weights and activations with post-training calibration on MIT-BIH Arrhythmia benchmark.',
    assigneeId: sMap['student8@projaxis.edu']._id,
    createdBy: guide3._id,
    priority: 'High',
    status: 'Done',
    startDate: new Date('2026-01-22'),
    dueDate: new Date('2026-02-10'),
    completedAt: new Date('2026-02-09')
  });

  await Task.create({
    taskId: 'TSK-0017',
    projectId: project4._id,
    title: 'Verilog RTL Pipelining on Xilinx Zynq-7000 SoC',
    description: 'Implement systolic array convolution layer in Verilog with AXI4 streaming master interface.',
    assigneeId: sMap['student9@projaxis.edu']._id,
    createdBy: guide3._id,
    priority: 'Highest',
    status: 'In Progress',
    startDate: new Date('2026-02-11'),
    dueDate: new Date('2026-03-25')
  });

  // Project 5 (IT) Tasks
  await Task.create({
    taskId: 'TSK-0018',
    projectId: project5._id,
    title: 'HL7-FHIR RESTful Microservices in Go',
    description: 'Build high-throughput Go service processing Patient and Observation resource bundles.',
    assigneeId: sMap['student16@projaxis.edu']._id,
    createdBy: guide5._id,
    priority: 'High',
    status: 'Done',
    startDate: new Date('2026-01-24'),
    dueDate: new Date('2026-02-12'),
    completedAt: new Date('2026-02-11')
  });

  await Task.create({
    taskId: 'TSK-0019',
    projectId: project5._id,
    title: 'Zero-Knowledge Patient Identity Verification',
    description: 'Generate zk-SNARK cryptographic proofs to verify clinical eligibility without revealing identity.',
    assigneeId: sMap['student17@projaxis.edu']._id,
    createdBy: guide5._id,
    priority: 'High',
    status: 'In Progress',
    startDate: new Date('2026-02-13'),
    dueDate: new Date('2026-03-20')
  });

  // Progress Reports
  console.log('Seeding Weekly Progress Reports...');
  await ProgressReport.create([
    {
      reportId: 'REP-2026-0001',
      projectId: project1._id,
      weekNo: 1,
      weekNumber: 1,
      weekStartDate: new Date('2026-01-19'),
      workDone: 'Configured Ubuntu 22.04 LTS and ROS2 Humble on NVIDIA Jetson Orin Nano. Flashed RealSense D435i firmware.',
      plannedNext: 'Integrate OpenVINS algorithm and calibrate stereo baseline.',
      blockers: 'None. JetPack installation completed successfully.',
      progress: 30,
      status: 'Reviewed',
      late: false,
      submittedBy: sMap['student1@projaxis.edu']._id
    },
    {
      reportId: 'REP-2026-0002',
      projectId: project1._id,
      weekNo: 2,
      weekNumber: 2,
      weekStartDate: new Date('2026-01-26'),
      workDone: 'Benchmarked OpenVINS on EuRoC MAV datasets. Measured translation drift of 0.8% over 120m trajectory.',
      plannedNext: 'Construct 3D OctoMap real-time occupancy grid.',
      blockers: 'Minor drift during rapid yaw rotations; resolved by tuning IMU noise variance.',
      progress: 55,
      status: 'Reviewed',
      late: false,
      submittedBy: sMap['student1@projaxis.edu']._id
    },
    {
      reportId: 'REP-2026-0003',
      projectId: project1._id,
      weekNo: 3,
      weekNumber: 3,
      weekStartDate: new Date('2026-02-02'),
      workDone: 'Implemented OctoMap voxel insertion at 20 Hz and bridged MAVROS trajectory topics to PX4 offboard mode.',
      plannedNext: 'Train and quantize YOLOv8 obstacle detector using TensorRT.',
      blockers: 'Pending 3D printed vibration isolation mount.',
      progress: 75,
      status: 'Submitted',
      late: false,
      submittedBy: sMap['student1@projaxis.edu']._id
    },
    {
      reportId: 'REP-2026-0004',
      projectId: project6._id,
      weekNo: 1,
      weekNumber: 1,
      weekStartDate: new Date('2026-01-26'),
      workDone: 'Completed SolidWorks packaging study and initial finite-volume mesh of 16-cell battery pack.',
      plannedNext: 'Simulate transient heat dissipation in ANSYS Fluent.',
      blockers: 'None.',
      progress: 35,
      status: 'Reviewed',
      late: false,
      submittedBy: sMap['student19@projaxis.edu']._id
    },
    {
      reportId: 'REP-2026-0005',
      projectId: project6._id,
      weekNo: 2,
      weekNumber: 2,
      weekStartDate: new Date('2026-02-02'),
      workDone: 'Fluent simulations demonstrated 4.2C peak temperature drop using multi-pass serpentine aluminum jacket.',
      plannedNext: 'CNC machining of aluminum cold plate prototype.',
      blockers: 'Raw 6061-T6 aluminum stock delivery took 4 days.',
      progress: 60,
      status: 'Reviewed',
      late: false,
      submittedBy: sMap['student19@projaxis.edu']._id
    },
    {
      reportId: 'REP-2026-0006',
      projectId: project6._id,
      weekNo: 3,
      weekNumber: 3,
      weekStartDate: new Date('2026-02-09'),
      workDone: 'Machined serpentine cold plate and programmed STM32 CAN bus telemetry module with digital thermocouple logger.',
      plannedNext: 'Dynamometer testing of fuzzy logic regenerative braking model.',
      blockers: 'None.',
      progress: 75,
      status: 'Submitted',
      late: false,
      submittedBy: sMap['student19@projaxis.edu']._id
    },
    {
      reportId: 'REP-2026-0007',
      projectId: project4._id,
      weekNo: 1,
      weekNumber: 1,
      weekStartDate: new Date('2026-01-26'),
      workDone: 'Quantized 1D CNN weights to INT8 fixed-point with 98.4% retention of floating-point accuracy.',
      plannedNext: 'Synthesize Verilog RTL on Zynq-7000 SoC.',
      progress: 40,
      status: 'Reviewed',
      late: false,
      submittedBy: sMap['student8@projaxis.edu']._id
    },
    {
      reportId: 'REP-2026-0008',
      projectId: project5._id,
      weekNo: 1,
      weekNumber: 1,
      weekStartDate: new Date('2026-01-26'),
      workDone: 'Designed Go microservices for HL7-FHIR patient interchange with mutual TLS encryption.',
      plannedNext: 'Implement zero-knowledge credential verification.',
      progress: 45,
      status: 'Reviewed',
      late: false,
      submittedBy: sMap['student16@projaxis.edu']._id
    }
  ]);

  // Project Documents
  console.log('Seeding Project Documents...');
  await Document.create([
    {
      documentId: 'DOC-2026-0001',
      versionGroupId: 'DOC-2026-0001',
      projectId: project1._id,
      category: 'Proposal',
      fileName: 'SRS_Autonomous_Drone_Navigation_v1.pdf',
      storedFilename: 'SRS_Autonomous_Drone_Navigation_v1.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      size: 1845200,
      uploadedBy: sMap['student1@projaxis.edu']._id
    },
    {
      documentId: 'DOC-2026-0002',
      versionGroupId: 'DOC-2026-0002',
      projectId: project1._id,
      category: 'Report',
      fileName: 'System_Architecture_ROS2_Jetson.png',
      storedFilename: 'System_Architecture_ROS2_Jetson.png',
      fileType: 'png',
      mimeType: 'image/png',
      size: 845200,
      uploadedBy: sMap['student2@projaxis.edu']._id
    },
    {
      documentId: 'DOC-2026-0003',
      versionGroupId: 'DOC-2026-0003',
      projectId: project1._id,
      category: 'Report',
      fileName: 'ProjAxis_Midterm_Technical_Report.pdf',
      storedFilename: 'ProjAxis_Midterm_Technical_Report.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      size: 3245000,
      uploadedBy: sMap['student1@projaxis.edu']._id
    },
    {
      documentId: 'DOC-2026-0004',
      versionGroupId: 'DOC-2026-0004',
      projectId: project1._id,
      category: 'Source Code',
      fileName: 'drone_vio_firmware_v0.9.zip',
      storedFilename: 'drone_vio_firmware_v0.9.zip',
      fileType: 'zip',
      mimeType: 'application/zip',
      size: 14500000,
      uploadedBy: sMap['student2@projaxis.edu']._id
    },
    {
      documentId: 'DOC-2026-0005',
      versionGroupId: 'DOC-2026-0005',
      projectId: project1._id,
      category: 'Presentation',
      fileName: 'Review1_Technical_Presentation.pptx',
      storedFilename: 'Review1_Technical_Presentation.pptx',
      fileType: 'pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      size: 4500000,
      uploadedBy: sMap['student1@projaxis.edu']._id
    },
    {
      documentId: 'DOC-2026-0006',
      versionGroupId: 'DOC-2026-0006',
      projectId: project6._id,
      category: 'Report',
      fileName: 'EV_Thermal_Simulation_CFD_Report.pdf',
      storedFilename: 'EV_Thermal_Simulation_CFD_Report.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      size: 4210000,
      uploadedBy: sMap['student19@projaxis.edu']._id
    },
    {
      documentId: 'DOC-2026-0007',
      versionGroupId: 'DOC-2026-0007',
      projectId: project6._id,
      category: 'Other',
      fileName: 'CAD_Assembly_Drawing_SolidWorks.pdf',
      storedFilename: 'CAD_Assembly_Drawing_SolidWorks.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      size: 2150000,
      uploadedBy: sMap['student20@projaxis.edu']._id
    },
    {
      documentId: 'DOC-2026-0008',
      versionGroupId: 'DOC-2026-0008',
      projectId: project6._id,
      category: 'Presentation',
      fileName: 'Review1_Thermal_Presentation.pptx',
      storedFilename: 'Review1_Thermal_Presentation.pptx',
      fileType: 'pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      size: 5120000,
      uploadedBy: sMap['student19@projaxis.edu']._id
    },
    {
      documentId: 'DOC-2026-0009',
      versionGroupId: 'DOC-2026-0009',
      projectId: project3._id,
      category: 'Report',
      fileName: 'Final_Capstone_Thesis_Report.pdf',
      storedFilename: 'Final_Capstone_Thesis_Report.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      size: 6800000,
      uploadedBy: sMap['student6@projaxis.edu']._id
    },
    {
      documentId: 'DOC-2026-0010',
      versionGroupId: 'DOC-2026-0010',
      projectId: project7._id,
      category: 'Report',
      fileName: 'Smart_Aero_Solar_EV_Final_Report.pdf',
      storedFilename: 'Smart_Aero_Solar_EV_Final_Report.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      size: 5400000,
      uploadedBy: sMap['student21@projaxis.edu']._id
    }
  ]);

  // Reviews & Evaluations & Attendance across CSE, ECE, IT, and MECH
  console.log('Seeding Comprehensive Reviews, Panels & Evaluations...');

  // 1. REV-2026-0001 (CSE Review 1, Completed & Published)
  const rev1 = await Review.create({
    reviewId: 'REV-2026-0001',
    projectId: project1._id,
    departmentId: deptCSE._id,
    reviewType: 'Review 1',
    reviewDate: new Date('2026-02-05T10:00:00'),
    venue: 'Seminar Hall 204, Turing Block',
    instructions: 'Prepare live visual odometry demonstration and architecture deck.',
    guideId: guide1._id,
    panelMemberIds: [panel2._id, panel3._id],
    status: 'Completed'
  });

  await Evaluation.create({
    evaluationId: 'EVL-2026-0001',
    reviewId: rev1._id,
    projectId: project1._id,
    rubricSnapshot: [
      { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
      { criterion: 'Methodology & System Architecture', maxMarks: 10 },
      { criterion: 'Implementation & Technical Rigor', maxMarks: 10 },
      { criterion: 'Results, Testing & Validation', maxMarks: 10 },
      { criterion: 'Presentation & Q&A Response', maxMarks: 10 }
    ],
    entries: [
      {
        studentId: sMap['student1@projaxis.edu']._id,
        panelScores: [
          {
            panelMemberId: panel2._id,
            scores: [
              { criterionIndex: 0, criterion: 'Problem Definition', marks: 10 },
              { criterionIndex: 1, criterion: 'Architecture', marks: 9 },
              { criterionIndex: 2, criterion: 'Implementation', marks: 10 },
              { criterionIndex: 3, criterion: 'Validation', marks: 9 },
              { criterionIndex: 4, criterion: 'Presentation', marks: 9 }
            ],
            total: 47,
            comments: 'Outstanding live hardware visual odometry demo.'
          }
        ],
        marks: 47,
        grade: 'O',
        remarks: 'Outstanding performance in visual-inertial odometry.'
      },
      {
        studentId: sMap['student2@projaxis.edu']._id,
        panelScores: [
          {
            panelMemberId: panel2._id,
            scores: [
              { criterionIndex: 0, criterion: 'Problem Definition', marks: 9 },
              { criterionIndex: 1, criterion: 'Architecture', marks: 10 },
              { criterionIndex: 2, criterion: 'Implementation', marks: 9 },
              { criterionIndex: 3, criterion: 'Validation', marks: 9 },
              { criterionIndex: 4, criterion: 'Presentation', marks: 9 }
            ],
            total: 46,
            comments: 'Rigorous camera-IMU calibration and stereo depth analysis.'
          }
        ],
        marks: 46,
        grade: 'O',
        remarks: 'Excellent work in sensor calibration and ROS2 architecture.'
      }
    ],
    status: 'Published',
    publishedBy: hodCSE._id,
    publishedAt: new Date('2026-02-06T15:00:00')
  });

  await Attendance.create({
    reviewId: rev1._id,
    projectId: project1._id,
    recordedBy: guide1._id,
    records: [
      { studentId: sMap['student1@projaxis.edu']._id, status: 'Present', note: 'Present on time' },
      { studentId: sMap['student2@projaxis.edu']._id, status: 'Present', note: 'Present on time' }
    ]
  });

  // 2. REV-2026-0002 (CSE Review 2, Scheduled & Draft Evaluation)
  const rev2 = await Review.create({
    reviewId: 'REV-2026-0002',
    projectId: project1._id,
    departmentId: deptCSE._id,
    reviewType: 'Review 2',
    reviewDate: new Date('2026-03-25T14:00:00'),
    venue: 'Computer Vision Research Lab 102',
    instructions: 'Autonomous maze navigation flight test and OctoMap presentation.',
    guideId: guide1._id,
    panelMemberIds: [panel2._id, panel3._id],
    status: 'Scheduled'
  });

  await Evaluation.create({
    evaluationId: 'EVL-2026-0002',
    reviewId: rev2._id,
    projectId: project1._id,
    rubricSnapshot: [
      { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
      { criterion: 'Methodology & System Architecture', maxMarks: 10 },
      { criterion: 'Implementation & Technical Rigor', maxMarks: 10 },
      { criterion: 'Results, Testing & Validation', maxMarks: 10 },
      { criterion: 'Presentation & Q&A Response', maxMarks: 10 }
    ],
    entries: [
      { studentId: sMap['student1@projaxis.edu']._id, panelScores: [], marks: 0, grade: 'Pending' },
      { studentId: sMap['student2@projaxis.edu']._id, panelScores: [], marks: 0, grade: 'Pending' }
    ],
    status: 'Draft'
  });

  // 3. REV-2026-0003 (MECH Review 1, Completed & Published)
  const rev3 = await Review.create({
    reviewId: 'REV-2026-0003',
    projectId: project6._id,
    departmentId: deptMECH._id,
    reviewType: 'Review 1',
    reviewDate: new Date('2026-02-12T11:00:00'),
    venue: 'CAD/CAM Conference Room 301',
    instructions: 'Present 3D CFD ANSYS Fluent simulations and cold plate CAD drawings.',
    guideId: guide8._id,
    panelMemberIds: [panel4._id, panel5._id],
    status: 'Completed'
  });

  await Evaluation.create({
    evaluationId: 'EVL-2026-0003',
    reviewId: rev3._id,
    projectId: project6._id,
    rubricSnapshot: [
      { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
      { criterion: 'Methodology & System Architecture', maxMarks: 10 },
      { criterion: 'Implementation & Technical Rigor', maxMarks: 10 },
      { criterion: 'Results, Testing & Validation', maxMarks: 10 },
      { criterion: 'Presentation & Q&A Response', maxMarks: 10 }
    ],
    entries: [
      {
        studentId: sMap['student19@projaxis.edu']._id,
        panelScores: [
          {
            panelMemberId: panel5._id,
            scores: [
              { criterionIndex: 0, criterion: 'Problem Definition', marks: 9 },
              { criterionIndex: 1, criterion: 'Architecture', marks: 9 },
              { criterionIndex: 2, criterion: 'Implementation', marks: 9 },
              { criterionIndex: 3, criterion: 'Validation', marks: 9 },
              { criterionIndex: 4, criterion: 'Presentation', marks: 9 }
            ],
            total: 45,
            comments: 'Rigorous thermodynamic fluid simulation and finite-volume formulation.'
          }
        ],
        marks: 45,
        grade: 'O',
        remarks: 'Outstanding CAD modeling and fluid flow validation.'
      },
      {
        studentId: sMap['student20@projaxis.edu']._id,
        panelScores: [
          {
            panelMemberId: panel5._id,
            scores: [
              { criterionIndex: 0, criterion: 'Problem Definition', marks: 9 },
              { criterionIndex: 1, criterion: 'Architecture', marks: 9 },
              { criterionIndex: 2, criterion: 'Implementation', marks: 9 },
              { criterionIndex: 3, criterion: 'Validation', marks: 9 },
              { criterionIndex: 4, criterion: 'Presentation', marks: 8 }
            ],
            total: 44,
            comments: 'Solid CAN bus sensor integration.'
          }
        ],
        marks: 44,
        grade: 'A+',
        remarks: 'Very good regenerative braking control design.'
      }
    ],
    status: 'Published',
    publishedBy: hodMECH._id,
    publishedAt: new Date('2026-02-13T16:00:00')
  });

  await Attendance.create({
    reviewId: rev3._id,
    projectId: project6._id,
    recordedBy: guide8._id,
    records: [
      { studentId: sMap['student19@projaxis.edu']._id, status: 'Present', note: 'Present on time' },
      { studentId: sMap['student20@projaxis.edu']._id, status: 'Present', note: 'Present on time' }
    ]
  });

  // 4. REV-2026-0004 (MECH Review 2, Scheduled)
  const rev4 = await Review.create({
    reviewId: 'REV-2026-0004',
    projectId: project6._id,
    departmentId: deptMECH._id,
    reviewType: 'Review 2',
    reviewDate: new Date('2026-03-28T10:30:00'),
    venue: 'Thermal Engineering Lab',
    instructions: 'Demonstrate dynamometer regenerative braking torque testbench.',
    guideId: guide8._id,
    panelMemberIds: [panel4._id, panel5._id],
    status: 'Scheduled'
  });

  await Evaluation.create({
    evaluationId: 'EVL-2026-0004',
    reviewId: rev4._id,
    projectId: project6._id,
    rubricSnapshot: [
      { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
      { criterion: 'Methodology & System Architecture', maxMarks: 10 },
      { criterion: 'Implementation & Technical Rigor', maxMarks: 10 },
      { criterion: 'Results, Testing & Validation', maxMarks: 10 },
      { criterion: 'Presentation & Q&A Response', maxMarks: 10 }
    ],
    entries: [
      { studentId: sMap['student19@projaxis.edu']._id, panelScores: [], marks: 0, grade: 'Pending' },
      { studentId: sMap['student20@projaxis.edu']._id, panelScores: [], marks: 0, grade: 'Pending' }
    ],
    status: 'Draft'
  });

  // 5. REV-2026-0005 (ECE Review 1, Completed & Published)
  const rev5 = await Review.create({
    reviewId: 'REV-2026-0005',
    projectId: project4._id,
    departmentId: deptECE._id,
    reviewType: 'Review 1',
    reviewDate: new Date('2026-02-10T09:30:00'),
    venue: 'VLSI Design Center 104',
    instructions: 'Present 1D-CNN INT8 quantization results and Vivado block diagram.',
    guideId: guide3._id,
    panelMemberIds: [panel2._id, panel4._id],
    status: 'Completed'
  });

  await Evaluation.create({
    evaluationId: 'EVL-2026-0005',
    reviewId: rev5._id,
    projectId: project4._id,
    rubricSnapshot: [
      { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
      { criterion: 'Methodology & System Architecture', maxMarks: 10 },
      { criterion: 'Implementation & Technical Rigor', maxMarks: 10 },
      { criterion: 'Results, Testing & Validation', maxMarks: 10 },
      { criterion: 'Presentation & Q&A Response', maxMarks: 10 }
    ],
    entries: [
      {
        studentId: sMap['student8@projaxis.edu']._id,
        panelScores: [{ panelMemberId: panel2._id, scores: [], total: 46 }],
        marks: 46,
        grade: 'O',
        remarks: 'Impressive quantization precision on FPGA.'
      },
      {
        studentId: sMap['student9@projaxis.edu']._id,
        panelScores: [{ panelMemberId: panel2._id, scores: [], total: 44 }],
        marks: 44,
        grade: 'A+',
        remarks: 'Clean AXI4 streaming Verilog pipelining.'
      }
    ],
    status: 'Published',
    publishedBy: hodECE._id,
    publishedAt: new Date('2026-02-11T14:00:00')
  });

  // 6. REV-2026-0006 (IT Review 1, Completed & Submitted - Awaiting HOD Publishing)
  const rev6 = await Review.create({
    reviewId: 'REV-2026-0006',
    projectId: project5._id,
    departmentId: deptIT._id,
    reviewType: 'Review 1',
    reviewDate: new Date('2026-02-15T15:00:00'),
    venue: 'Cloud Computing Lab 402',
    instructions: 'Demonstrate Go microservices and FHIR patient bundle interchange.',
    guideId: guide5._id,
    panelMemberIds: [panel3._id, panel4._id],
    status: 'Completed'
  });

  await Evaluation.create({
    evaluationId: 'EVL-2026-0006',
    reviewId: rev6._id,
    projectId: project5._id,
    rubricSnapshot: [
      { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
      { criterion: 'Methodology & System Architecture', maxMarks: 10 },
      { criterion: 'Implementation & Technical Rigor', maxMarks: 10 },
      { criterion: 'Results, Testing & Validation', maxMarks: 10 },
      { criterion: 'Presentation & Q&A Response', maxMarks: 10 }
    ],
    entries: [
      {
        studentId: sMap['student16@projaxis.edu']._id,
        panelScores: [{ panelMemberId: panel4._id, scores: [], total: 43 }],
        marks: 43,
        grade: 'A+',
        remarks: 'Solid Go implementation with Kubernetes Helm charts.'
      },
      {
        studentId: sMap['student17@projaxis.edu']._id,
        panelScores: [{ panelMemberId: panel4._id, scores: [], total: 44 }],
        marks: 44,
        grade: 'A+',
        remarks: 'Strong cryptographic formulation for zero-knowledge proofs.'
      }
    ],
    status: 'Submitted'
  });

  // 7. REV-2026-0007 (CSE Completed Project Final Viva)
  const rev7 = await Review.create({
    reviewId: 'REV-2026-0007',
    projectId: project3._id,
    departmentId: deptCSE._id,
    reviewType: 'Final Viva',
    reviewDate: new Date('2026-02-14T10:00:00'),
    venue: 'Main Auditorium',
    instructions: 'Final capstone thesis oral defense and live system demonstration.',
    guideId: guide4._id,
    panelMemberIds: [panel2._id, panel3._id],
    status: 'Completed'
  });

  await Evaluation.create({
    evaluationId: 'EVL-2026-0007',
    reviewId: rev7._id,
    projectId: project3._id,
    rubricSnapshot: [
      { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
      { criterion: 'Methodology & System Architecture', maxMarks: 10 },
      { criterion: 'Implementation & Technical Rigor', maxMarks: 10 },
      { criterion: 'Results, Testing & Validation', maxMarks: 10 },
      { criterion: 'Presentation & Q&A Response', maxMarks: 10 }
    ],
    entries: [
      {
        studentId: sMap['student6@projaxis.edu']._id,
        panelScores: [{ panelMemberId: panel2._id, scores: [], total: 48 }],
        marks: 48,
        grade: 'O',
        remarks: 'Outstanding IoT waste sorting accuracy with LoRaWAN.'
      },
      {
        studentId: sMap['student7@projaxis.edu']._id,
        panelScores: [{ panelMemberId: panel2._id, scores: [], total: 49 }],
        marks: 49,
        grade: 'O',
        remarks: 'Flawless thesis defense and edge classification latency.'
      }
    ],
    status: 'Published',
    publishedBy: hodCSE._id,
    publishedAt: new Date('2026-02-15T11:00:00')
  });

  // 8. REV-2026-0008 (MECH Completed Project Final Viva)
  const rev8 = await Review.create({
    reviewId: 'REV-2026-0008',
    projectId: project7._id,
    departmentId: deptMECH._id,
    reviewType: 'Final Viva',
    reviewDate: new Date('2026-02-09T14:30:00'),
    venue: 'Mechanical Auditorium',
    instructions: 'Final aerodynamic drag testing thesis defense.',
    guideId: guide9._id,
    panelMemberIds: [panel4._id, panel5._id],
    status: 'Completed'
  });

  await Evaluation.create({
    evaluationId: 'EVL-2026-0008',
    reviewId: rev8._id,
    projectId: project7._id,
    rubricSnapshot: [
      { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
      { criterion: 'Methodology & System Architecture', maxMarks: 10 },
      { criterion: 'Implementation & Technical Rigor', maxMarks: 10 },
      { criterion: 'Results, Testing & Validation', maxMarks: 10 },
      { criterion: 'Presentation & Q&A Response', maxMarks: 10 }
    ],
    entries: [
      {
        studentId: sMap['student21@projaxis.edu']._id,
        panelScores: [{ panelMemberId: panel5._id, scores: [], total: 47 }],
        marks: 47,
        grade: 'O',
        remarks: 'Exceptional wind tunnel drag reduction data.'
      },
      {
        studentId: sMap['student22@projaxis.edu']._id,
        panelScores: [{ panelMemberId: panel5._id, scores: [], total: 46 }],
        marks: 46,
        grade: 'O',
        remarks: 'Smart shape memory alloy morphing wing demonstrated.'
      }
    ],
    status: 'Published',
    publishedBy: hodMECH._id,
    publishedAt: new Date('2026-02-10T17:00:00')
  });

  // Calendar Events
  console.log('Seeding Institutional Calendar Events...');
  await CalendarEvent.create([
    {
      eventId: 'EVT-2026-0001',
      projectId: project1._id,
      departmentId: deptCSE._id,
      organizerId: hodCSE._id,
      title: 'Review 2 - Autonomous Drone Navigation',
      description: 'Second progress evaluation with live indoor flight demonstration.',
      eventType: 'Review',
      startAt: new Date('2026-03-25T14:00:00'),
      endAt: new Date('2026-03-25T15:30:00'),
      venue: 'Computer Vision Research Lab 102'
    },
    {
      eventId: 'EVT-2026-0002',
      projectId: project6._id,
      departmentId: deptMECH._id,
      organizerId: hodMECH._id,
      title: 'Review 2 - EV Thermal Management & Braking',
      description: 'Progress evaluation on bench dynamometer and CAN bus telemetry.',
      eventType: 'Review',
      startAt: new Date('2026-03-28T10:30:00'),
      endAt: new Date('2026-03-28T12:00:00'),
      venue: 'Thermal Engineering Lab'
    },
    {
      eventId: 'EVT-2026-0003',
      projectId: project1._id,
      departmentId: deptCSE._id,
      organizerId: guide1._id,
      title: 'Weekly Report Submission Deadline',
      description: 'Mandatory weekly progress report submission before midnight.',
      eventType: 'Deadline',
      startAt: new Date('2026-03-29T20:00:00'),
      endAt: new Date('2026-03-29T23:59:00'),
      venue: 'Online Portal'
    },
    {
      eventId: 'EVT-2026-0004',
      projectId: project1._id,
      departmentId: deptCSE._id,
      organizerId: guide1._id,
      title: 'Milestone MS-03: Autonomous Waypoint Navigation',
      description: 'Due date for autonomous maze trajectory navigation.',
      eventType: 'Deadline',
      startAt: new Date('2026-03-30T10:00:00'),
      endAt: new Date('2026-03-30T17:00:00'),
      venue: 'Turing Block Gymnasium'
    }
  ]);

  // Notifications
  console.log('Seeding System & Milestone Notifications...');
  await Notification.create([
    {
      notificationId: 'NOTIF-2026-0001',
      recipientId: sMap['student1@projaxis.edu']._id,
      category: 'Review',
      message: 'Review 1 marks and evaluation results have been published by CSE HOD.',
      status: 'Read',
      relatedEntityType: 'Review',
      relatedEntityId: rev1.reviewId
    },
    {
      notificationId: 'NOTIF-2026-0002',
      recipientId: sMap['student1@projaxis.edu']._id,
      category: 'Review',
      message: 'Review 2 has been scheduled for 25th March 2026 at 2:00 PM in CV Lab 102.',
      status: 'Unread',
      relatedEntityType: 'Review',
      relatedEntityId: rev2.reviewId
    },
    {
      notificationId: 'NOTIF-2026-0003',
      recipientId: sMap['student19@projaxis.edu']._id,
      category: 'Review',
      message: 'Mechanical Engineering Review 1 results have been published by MECH HOD.',
      status: 'Read',
      relatedEntityType: 'Review',
      relatedEntityId: rev3.reviewId
    },
    {
      notificationId: 'NOTIF-2026-0004',
      recipientId: guide1._id,
      category: 'Progress',
      message: 'Week 3 progress report submitted by Team PRJ-2026-CSE-001 (Karthik Raman).',
      status: 'Unread',
      relatedEntityType: 'Project',
      relatedEntityId: project1.projectId
    },
    {
      notificationId: 'NOTIF-2026-0005',
      recipientId: hodCSE._id,
      category: 'Proposal',
      message: 'Proposal PRP-2026-0013 approved by Dr. Meera Krishnan, awaiting topic sanction.',
      status: 'Unread',
      relatedEntityType: 'ProjectProposal',
      relatedEntityId: 'PRP-2026-0013'
    }
  ]);

  // Activity Logs
  console.log('Seeding Activity Trail...');
  await ActivityLog.create([
    {
      actor: { userId: admin._id, name: admin.name, role: 'admin' },
      action: 'SYSTEM_SEEDED',
      entity: 'System',
      entityId: 'SYSTEM',
      description: 'System seeded with academic policies, departments, and initial project records.',
      timestamp: new Date('2026-01-01')
    },
    {
      actor: { userId: hodCSE._id, name: hodCSE.name, role: 'hod' },
      action: 'TOPIC_SANCTIONED',
      entity: 'Project',
      entityId: project1.projectId,
      projectId: project1._id,
      description: 'Sanctioned topic approval for AI-Powered Autonomous Drone Navigation.',
      timestamp: new Date('2026-01-15')
    },
    {
      actor: { userId: sMap['student1@projaxis.edu']._id, name: sMap['student1@projaxis.edu'].name, role: 'student' },
      action: 'TASK_COMPLETED',
      entity: 'Task',
      entityId: task1_1.taskId,
      projectId: project1._id,
      description: 'Completed task: Setup ROS2 Humble and Jetson Orin Nano Flashing.',
      timestamp: new Date('2026-01-24')
    },
    {
      actor: { userId: hodCSE._id, name: hodCSE.name, role: 'hod' },
      action: 'EVALUATION_PUBLISHED',
      entity: 'Evaluation',
      entityId: 'EVL-2026-0001',
      projectId: project1._id,
      description: 'Published official marks for Review 1 session.',
      timestamp: new Date('2026-02-06T15:00:00')
    },
    {
      actor: { userId: hodMECH._id, name: hodMECH.name, role: 'hod' },
      action: 'TOPIC_SANCTIONED',
      entity: 'Project',
      entityId: project6.projectId,
      projectId: project6._id,
      description: 'Sanctioned topic approval for Autonomous EV Thermal Management.',
      timestamp: new Date('2026-01-20')
    }
  ]);

  // 9. Synchronize Counters
  console.log('Synchronizing system sequences and counters...');
  await Counter.create([
    { name: 'user', seq: 300 },
    { name: 'notification', seq: 200 },
    { name: 'document', seq: 200 },
    { name: 'progress-report', seq: 200 },
    { name: 'review', seq: 200 },
    { name: 'evaluation', seq: 200 },
    { name: 'feedback', seq: 200 },
    { name: 'calendar-event', seq: 200 },
    { name: 'PRP-2026', seq: 200 },
    { name: 'PRJ-2026', seq: 200 },
    { name: `task-${project1._id}`, seq: 20 },
    { name: `workstream-${project1._id}`, seq: 20 },
    { name: `milestone-${project1._id}`, seq: 20 },
    { name: `task-${project2._id}`, seq: 20 },
    { name: `workstream-${project2._id}`, seq: 20 },
    { name: `milestone-${project2._id}`, seq: 20 },
    { name: `task-${project3._id}`, seq: 20 },
    { name: `task-${project4._id}`, seq: 20 },
    { name: `workstream-${project4._id}`, seq: 20 },
    { name: `milestone-${project4._id}`, seq: 20 },
    { name: `task-${project5._id}`, seq: 20 },
    { name: `task-${project6._id}`, seq: 20 },
    { name: `workstream-${project6._id}`, seq: 20 },
    { name: `milestone-${project6._id}`, seq: 20 },
    { name: `task-${project7._id}`, seq: 20 },
    { name: `task-${project8._id}`, seq: 20 }
  ]);

  console.log('\n======================================================');
  console.log('  PROJAXIS SEED DATA GENERATED WITH 100% COMPLETION!');
  console.log('======================================================');
  console.log('Default Password for ALL accounts: ' + defaultPassword);
  console.log('------------------------------------------------------');
  console.log('Administrator:');
  console.log('  admin@projaxis.edu                  - S. Rajagopalan');
  console.log('------------------------------------------------------');
  console.log('Department HODs:');
  console.log('  hod.cse@projaxis.edu                - Dr. V. Balaji (CSE HOD)');
  console.log('  hod.ece@projaxis.edu                - Dr. S. Padmanabhan (ECE HOD)');
  console.log('  hod.it@projaxis.edu                 - Dr. R. Meenakshi Sundaram (IT HOD)');
  console.log('  hod.mech@projaxis.edu               - Dr. K. Sridharan (MECH HOD)');
  console.log('------------------------------------------------------');
  console.log('Faculty Guides:');
  console.log('  guide.subramanian@projaxis.edu      - Dr. R. Subramanian (CSE, Active Guide)');
  console.log('  guide.meera@projaxis.edu            - Dr. Meera Krishnan (CSE, Guide & Panel Chair)');
  console.log('  guide.ananth@projaxis.edu           - Dr. S. Ananthakrishnan (CSE, Guide)');
  console.log('  guide.venkat@projaxis.edu           - Dr. K. Venkataraman (ECE, Senior Guide)');
  console.log('  guide.soundar@projaxis.edu          - Dr. G. Soundararajan (ECE, Guide)');
  console.log('  guide.murugan@projaxis.edu          - Dr. P. Muruganandam (IT, Guide)');
  console.log('  guide.karthikeyan@projaxis.edu      - Dr. M. Karthikeyan (IT, Guide)');
  console.log('  guide.jayaraman@projaxis.edu        - Dr. A. Jayaraman (MECH, Guide)');
  console.log('  guide.suresh@projaxis.edu           - Dr. N. Suresh Babu (MECH, Guide)');
  console.log('------------------------------------------------------');
  console.log('Review Panel Members:');
  console.log('  panel.radhakrishnan@projaxis.edu    - Dr. Radhakrishnan T. (External Expert)');
  console.log('  panel.revathi@projaxis.edu          - Dr. Revathi Senthilkumar (Review Chair)');
  console.log('  panel.anandhan@projaxis.edu         - Dr. C. Anandhan (Industry Specialist)');
  console.log('  panel.vijayalakshmi@projaxis.edu    - Dr. B. Vijayalakshmi (Senior Mechatronics Evaluator)');
  console.log('------------------------------------------------------');
  console.log('Key Students:');
  console.log('  student1@projaxis.edu               - Karthik Raman (Project 1 Active in CSE)');
  console.log('  student2@projaxis.edu               - Ananya Sundaram (Project 1 Active in CSE)');
  console.log('  student3@projaxis.edu               - Vigneshwaran K. (Project 2 Final Submitted in CSE)');
  console.log('  student8@projaxis.edu               - Meenakshi Natarajan (Project 4 Active in ECE)');
  console.log('  student16@projaxis.edu              - Sanjay Vaidyanathan (Project 5 Under Evaluation in IT)');
  console.log('  student19@projaxis.edu              - Aditya Narayanan (Project 6 Active in MECH)');
  console.log('  student20@projaxis.edu              - Siddharth Ramanathan (Project 6 Active in MECH)');
  console.log('======================================================\n');

  await disconnectDB();
  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
