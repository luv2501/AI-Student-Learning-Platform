/**
 * FileSense: Deterministic Demo Data Seeder (Task 7.2).
 * Seeds a comprehensive demo environment with realistic academic documents,
 * structured notes, flashcards with SM-2 review progress, quiz history with
 * detected weak spots, 7-day focus sessions, and active study tasks.
 *
 * Safety: Fails immediately if process.env.NODE_ENV === 'production'.
 * Run via: node server/scripts/seed-demo.js or npm run seed:demo
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

dotenv.config();
dotenv.config({ path: path.join(serverDir, '.env') });

// Environment Protection: Never seed in production
if (process.env.NODE_ENV === 'production') {
  console.error('\n[seed-demo] Fatal: Refusing to seed demo data in production environment (NODE_ENV=production).\n');
  process.exit(1);
}

import User from '../src/models/User.js';
import Document from '../src/models/Document.js';
import CardReview from '../src/models/CardReview.js';
import QuizAttempt from '../src/models/QuizAttempt.js';
import StudySession from '../src/models/StudySession.js';
import Task from '../src/models/Task.js';
import AskHistory from '../src/models/AskHistory.js';
import { computeCardId } from '../src/utils/cardId.js';
import { getDateString } from '../src/utils/streak.js';

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('\n[seed-demo] Error: MONGO_URI is not set. Please configure it in server/.env.\n');
    process.exit(1);
  }

  console.log('\n========================================================================================');
  console.log('FileSense: Deterministic Demo Data Seeder');
  console.log('========================================================================================\n');

  await mongoose.connect(mongoUri);
  console.log(`Connected to database: ${mongoose.connection.host}/${mongoose.connection.name}`);

  // Ensure uploads directory exists
  const uploadsDir = path.join(serverDir, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const dummyPdfHeader = '%PDF-1.4\n%Demo PDF content placeholder for FileSense\n%%EOF';
  const file1Path = path.join(uploadsDir, 'demo_distributed_systems_consensus.pdf');
  const file2Path = path.join(uploadsDir, 'demo_os_virtual_memory_paging.pdf');
  if (!fs.existsSync(file1Path)) fs.writeFileSync(file1Path, dummyPdfHeader);
  if (!fs.existsSync(file2Path)) fs.writeFileSync(file2Path, dummyPdfHeader);

  // 1. Clean up existing demo user records for idempotent execution
  const demoEmail = 'demo@filesense.dev';
  const existingUser = await User.findOne({ email: demoEmail });
  if (existingUser) {
    const existingDocs = await Document.find({ user: existingUser._id }).select('_id');
    const docIds = existingDocs.map((d) => d._id);

    await CardReview.deleteMany({ userId: existingUser._id });
    await QuizAttempt.deleteMany({ userId: existingUser._id });
    await StudySession.deleteMany({ userId: existingUser._id });
    await Task.deleteMany({ user: existingUser._id });
    await AskHistory.deleteMany({ userId: existingUser._id });
    await Document.deleteMany({ user: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
    console.log('Cleaned up previous demo user records.');
  }

  // 2. Create Deterministic Demo User
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const todayStr = getDateString(new Date(), tz);

  const demoUser = await User.create({
    name: 'Demo Student',
    email: demoEmail,
    password: 'DemoPassword123!',
    institution: 'Imperial College London',
    streakCount: 5,
    longestStreak: 12,
    lastActiveDate: todayStr,
  });

  console.log('\n[1/6] Created Demo User:');
  console.log(`      Name:           ${demoUser.name}`);
  console.log(`      Email:          ${demoUser.email}`);
  console.log(`      Active Streak:  ${demoUser.streakCount} days (Longest: ${demoUser.longestStreak} days)`);
  console.log(`      Last Active:    ${demoUser.lastActiveDate}`);

  // 3. Create Document 1: Distributed Systems and Consensus Protocols
  const doc1 = await Document.create({
    user: demoUser._id,
    originalName: 'Distributed Systems and Consensus Protocols.pdf',
    fileName: 'demo_distributed_systems_consensus.pdf',
    filePath: path.join('uploads', 'demo_distributed_systems_consensus.pdf'),
    size: 1482910,
    pageCount: 3,
    textLength: 4200,
    extractedText: `Distributed Systems and Consensus Protocols
Page 1: Foundations of Fault-Tolerant Consensus
In distributed systems, consensus protocols enable a set of independent nodes to agree on a state machine transition despite network partitions, message loss, and machine crashes (Crash-Fault-Tolerant or CFT models). Classical Paxos, introduced by Leslie Lamport, establishes consensus via two distinct phases: Prepare/Promise and Propose/Accept. Paxos guarantees safety under asynchronous network conditions where message delays are unbounded, preventing split-brain states through strict majority quorums (N/2 + 1 nodes).

Page 2: Raft Consensus Algorithm and Leader Election
Raft decomposes consensus into explicit sub-problems: Leader Election, Log Replication, and Safety. A cluster consists of nodes in one of three states: Follower, Candidate, or Leader. Time is divided into terms of arbitrary length, identified by monotonically increasing integers. If a Follower receives no heartbeats within its randomized election timeout (typically 150ms-300ms), it increments its term, transitions to Candidate, and broadcasts RequestVote RPCs. A candidate becomes Leader upon receiving votes from a majority of nodes in the cluster.

Page 3: Network Partitions, Split-Brain Mitigation, and Linearizable Reads
During a network partition, nodes may be divided into minority and majority components. Split-brain occurs if both partitions elect a leader and independently commit state updates. Raft mitigates split-brain by requiring log commits to reach a majority quorum before acknowledgment. A leader isolated in a minority partition cannot reach quorum and cannot commit new log entries. For linearizable reads, the leader must verify its leadership via heartbeat quorums before serving queries to avoid reading stale uncommitted logs.`,
    pages: [
      {
        pageNumber: 1,
        text: 'Distributed Systems and Consensus Protocols\nPage 1: Foundations of Fault-Tolerant Consensus\nIn distributed systems, consensus protocols enable a set of independent nodes to agree on a state machine transition despite network partitions, message loss, and machine crashes (Crash-Fault-Tolerant or CFT models). Classical Paxos, introduced by Leslie Lamport, establishes consensus via two distinct phases: Prepare/Promise and Propose/Accept. Paxos guarantees safety under asynchronous network conditions where message delays are unbounded, preventing split-brain states through strict majority quorums (N/2 + 1 nodes).',
      },
      {
        pageNumber: 2,
        text: 'Page 2: Raft Consensus Algorithm and Leader Election\nRaft decomposes consensus into explicit sub-problems: Leader Election, Log Replication, and Safety. A cluster consists of nodes in one of three states: Follower, Candidate, or Leader. Time is divided into terms of arbitrary length, identified by monotonically increasing integers. If a Follower receives no heartbeats within its randomized election timeout (typically 150ms-300ms), it increments its term, transitions to Candidate, and broadcasts RequestVote RPCs. A candidate becomes Leader upon receiving votes from a majority of nodes in the cluster.',
      },
      {
        pageNumber: 3,
        text: 'Page 3: Network Partitions, Split-Brain Mitigation, and Linearizable Reads\nDuring a network partition, nodes may be divided into minority and majority components. Split-brain occurs if both partitions elect a leader and independently commit state updates. Raft mitigates split-brain by requiring log commits to reach a majority quorum before acknowledgment. A leader isolated in a minority partition cannot reach quorum and cannot commit new log entries. For linearizable reads, the leader must verify its leadership via heartbeat quorums before serving queries to avoid reading stale uncommitted logs.',
      },
    ],
    notes: {
      summary: 'Consensus protocols like Paxos and Raft allow distributed state machines to agree on ordered transitions under asynchronous network conditions with crash faults. Raft decomposes consensus into leader election, log replication, and safety using randomized election timeouts and strict majority quorums to prevent split-brain anomalies during network partitions.',
      keyPoints: [
        'Paxos achieves consensus using two phases (Prepare/Promise and Propose/Accept) but is notoriously hard to implement.',
        'Raft simplifies consensus by decomposing it into leader election, log replication, and safety invariants.',
        'Nodes transition between Follower, Candidate, and Leader states governed by terms and randomized election timeouts.',
        'Majority quorums (N/2 + 1) guarantee that at least one node contains the most up-to-date committed log entry.',
        'Split-brain scenarios are mitigated because minority partitions cannot achieve majority confirmation to commit log entries.',
      ],
      sections: [
        {
          heading: 'Consensus Foundations',
          points: [
            'State Machine Replication requires identical execution order across all cluster nodes.',
            'CFT models tolerate up to f node failures in a cluster of 2f + 1 nodes.',
            'Safety guarantees no two correct nodes commit conflicting entries at the same index.',
          ],
        },
        {
          heading: 'Raft Leader Election',
          points: [
            'Followers reset election timers upon receiving AppendEntries heartbeats from the active leader.',
            'Randomized timeouts between 150ms and 300ms minimize split-vote occurrences among candidates.',
            'Candidates require majority vote and must possess logs at least as up-to-date as the voter.',
          ],
        },
        {
          heading: 'Split-Brain and Network Partitions',
          points: [
            'Partitions separate nodes into disjoint subsets unable to exchange messages.',
            'Minority partitions cannot reach the majority quorum needed to commit new entries.',
            'Linearizable read operations verify leadership via heartbeat quorums before replying to clients.',
          ],
        },
      ],
    },
    flashcards: [
      {
        question: 'What is the primary condition required to form a majority quorum in a cluster of N nodes?',
        answer: 'A majority quorum strictly requires at least (N / 2) + 1 nodes, ensuring any two quorums overlap by at least one node.',
      },
      {
        question: 'Why does Raft randomize election timeouts across cluster nodes?',
        answer: 'Randomized timeouts (typically 150ms-300ms) prevent split-vote deadlocks where multiple candidates start simultaneous elections and divide votes equally.',
      },
      {
        question: 'What happens when a Raft leader becomes isolated in a minority network partition?',
        answer: 'The isolated leader continues receiving client proposals but cannot replicate them to a majority quorum, so entries remain uncommitted and are never executed.',
      },
      {
        question: 'How does Paxos handle consensus across its two phases?',
        answer: 'Phase 1 performs Prepare and Promise to discover existing values and establish proposal numbers; Phase 2 performs Propose and Accept to commit the value.',
      },
      {
        question: 'What rule ensures Raft log completeness during leader election?',
        answer: 'A voter denies vote if the candidate log is less up-to-date than its own, evaluated by comparing last log term then last log index.',
      },
      {
        question: 'How does Raft guarantee linearizable read consistency without writing to the log?',
        answer: 'The leader must exchange heartbeat RPCs with a majority quorum to verify it has not been deposed before returning read results.',
      },
    ],
    quiz: [
      {
        question: 'In a 5-node distributed cluster, what is the minimum number of nodes required to form a valid consensus quorum?',
        options: ['2 nodes', '3 nodes', '4 nodes', '5 nodes'],
        correctIndex: 1,
        explanation: 'In a cluster of 5 nodes, a majority quorum requires (5 / 2) + 1 = 3 nodes.',
        topic: 'Consensus Foundations',
      },
      {
        question: 'What mechanism does Raft use to avoid repeated split-vote ties during leader elections?',
        options: [
          'Manual operator intervention',
          'Randomized election timeouts (150ms-300ms)',
          'Fixed priority IDs assigned to hardware',
          'Round-robin turn-taking',
        ],
        correctIndex: 1,
        explanation: 'Raft randomizes election timeouts between 150ms and 300ms so one follower times out first and captures votes before others trigger.',
        topic: 'Raft Leader Election',
      },
      {
        question: 'What happens if a Raft candidate receives votes from exactly 2 out of 5 cluster nodes?',
        options: [
          'It becomes leader immediately',
          'It remains a follower',
          'It does not become leader and waits for timeout to initiate a new term',
          'It halts the cluster',
        ],
        correctIndex: 2,
        explanation: 'A majority of 5 nodes requires 3 votes; with only 2 votes, the candidate cannot win and times out to begin a new term.',
        topic: 'Raft Leader Election',
      },
      {
        question: 'Why can a leader isolated in a minority network partition not commit state machine entries?',
        options: [
          'Its clock stops ticking',
          'It cannot receive acknowledgment from a majority quorum',
          'The operating system terminates its process',
          'It immediately forgets its current term',
        ],
        correctIndex: 1,
        explanation: 'Raft requires commit acknowledgment from a majority quorum; an isolated minority partition cannot meet this threshold.',
        topic: 'Split-Brain Mitigation',
      },
      {
        question: 'Under the CFT (Crash-Fault-Tolerant) failure model, how many node failures can a cluster of 2f + 1 nodes tolerate?',
        options: ['f + 1 failures', '2f failures', 'f failures', '1 failure'],
        correctIndex: 2,
        explanation: 'A cluster of 2f + 1 nodes can tolerate up to f crash failures while retaining a working majority of f + 1 nodes.',
        topic: 'Consensus Foundations',
      },
    ],
  });

  // 4. Create Document 2: Operating Systems: Virtual Memory and Paging
  const doc2 = await Document.create({
    user: demoUser._id,
    originalName: 'Operating Systems - Virtual Memory and Paging.pdf',
    fileName: 'demo_os_virtual_memory_paging.pdf',
    filePath: path.join('uploads', 'demo_os_virtual_memory_paging.pdf'),
    size: 1198420,
    pageCount: 2,
    textLength: 2800,
    extractedText: `Operating Systems: Virtual Memory and Paging
Page 1: Address Translation and Page Tables
Virtual memory decouples the programmer logical address space from physical memory (RAM). The memory management unit (MMU) translates virtual addresses to physical addresses using page tables. A virtual address is partitioned into a virtual page number (VPN) and a page offset. Multi-level page tables reduce memory overhead by allocating page table frames on-demand. The Translation Lookaside Buffer (TLB) is a hardware cache that accelerates page table lookups, mitigating the performance penalty of multi-memory accesses per memory reference.

Page 2: Page Faults and Replacement Algorithms
When a program accesses a virtual page whose valid bit in the page table entry (PTE) is 0, the MMU generates a hardware trap called a page fault. The OS kernel page fault handler pauses the running process, locates a free frame in physical memory, reads the requested page from swap space into RAM, updates the PTE valid bit, and resumes execution. When physical memory is saturated, page replacement algorithms such as Least Recently Used (LRU) or Clock/Second-Chance select victim frames to evict to disk.`,
    pages: [
      {
        pageNumber: 1,
        text: 'Operating Systems: Virtual Memory and Paging\nPage 1: Address Translation and Page Tables\nVirtual memory decouples the programmer logical address space from physical memory (RAM). The memory management unit (MMU) translates virtual addresses to physical addresses using page tables. A virtual address is partitioned into a virtual page number (VPN) and a page offset. Multi-level page tables reduce memory overhead by allocating page table frames on-demand. The Translation Lookaside Buffer (TLB) is a hardware cache that accelerates page table lookups, mitigating the performance penalty of multi-memory accesses per memory reference.',
      },
      {
        pageNumber: 2,
        text: 'Page 2: Page Faults and Replacement Algorithms\nWhen a program accesses a virtual page whose valid bit in the page table entry (PTE) is 0, the MMU generates a hardware trap called a page fault. The OS kernel page fault handler pauses the running process, locates a free frame in physical memory, reads the requested page from swap space into RAM, updates the PTE valid bit, and resumes execution. When physical memory is saturated, page replacement algorithms such as Least Recently Used (LRU) or Clock/Second-Chance select victim frames to evict to disk.',
      },
    ],
    notes: {
      summary: 'Virtual memory isolates process address spaces and expands apparent capacity using hardware address translation via the MMU and page tables. TLBs accelerate lookups, while page fault handlers swap memory pages on-demand using replacement policies like LRU.',
      keyPoints: [
        'Virtual memory separates virtual addresses from physical RAM frames via the Memory Management Unit (MMU).',
        'Multi-level page tables avoid allocating page table entries for unmapped address spaces.',
        'Translation Lookaside Buffers (TLB) cache recent translations, minimizing memory lookup penalties.',
        'A page fault triggers an OS interrupt to fetch missing pages from backing storage (swap disk).',
        'Page replacement algorithms (e.g. LRU, Clock) determine which frames to evict when physical RAM is full.',
      ],
      sections: [
        {
          heading: 'Paging Architecture',
          points: [
            'Virtual addresses split into Virtual Page Number (VPN) index and offset within page.',
            'Page size is universally a power of 2 (typically 4 KB in x86-64 architecture).',
            'Page table entries (PTE) contain physical frame numbers and protection/validity bits.',
          ],
        },
        {
          heading: 'Page Fault Handling',
          points: [
            'MMU raises trap if the valid bit is 0, transferring control to kernel handler.',
            'Handler issues asynchronous disk I/O to read page from swap space into an empty frame.',
            'Process context is restored and the faulting instruction is re-executed transparently.',
          ],
        },
      ],
    },
    flashcards: [
      {
        question: 'What is the primary role of the Memory Management Unit (MMU)?',
        answer: 'The MMU translates virtual memory addresses generated by the CPU into physical addresses in RAM using page tables.',
      },
      {
        question: 'How does a Translation Lookaside Buffer (TLB) optimize paging?',
        answer: 'The TLB acts as a high-speed hardware cache for virtual-to-physical address mappings, avoiding multi-level RAM lookups on hit.',
      },
      {
        question: 'What sequence occurs when a page fault exception is raised?',
        answer: 'The CPU traps to the kernel handler, which finds a free RAM frame, loads the page from disk, updates the PTE valid bit, and restarts the instruction.',
      },
      {
        question: 'Why are multi-level page tables preferred over single-level page tables in 64-bit systems?',
        answer: 'Multi-level page tables allocate intermediate tables on demand, preventing gigabytes of empty page table allocations for sparse address spaces.',
      },
    ],
    quiz: [
      {
        question: 'What component is responsible for translating virtual addresses into physical addresses in hardware?',
        options: [
          'Arithmetic Logic Unit (ALU)',
          'Memory Management Unit (MMU)',
          'Direct Memory Access controller (DMA)',
          'PCIe bridge',
        ],
        correctIndex: 1,
        explanation: 'The MMU contains the hardware circuitry that performs address translation using page tables and the TLB.',
        topic: 'Address Translation',
      },
      {
        question: 'What happens when an accessed virtual page has its valid bit set to 0 in the page table entry?',
        options: [
          'The CPU catches fire',
          'The OS terminates the kernel',
          'A page fault trap is generated to load the page from disk',
          'The instruction is silently skipped',
        ],
        correctIndex: 2,
        explanation: 'A valid bit of 0 triggers a page fault exception, causing the OS kernel to load the missing page into RAM.',
        topic: 'Page Fault Handling',
      },
      {
        question: 'In x86-64 architecture, what is the default standard page size?',
        options: ['1 KB', '4 KB', '64 KB', '1 MB'],
        correctIndex: 1,
        explanation: 'Standard x86-64 memory paging utilizes 4 KB (4096 bytes) base page sizes.',
        topic: 'Paging Architecture',
      },
    ],
  });

  console.log('\n[2/6] Seeded Technical Documents:');
  console.log(`      1. ${doc1.originalName} (${doc1.pageCount} pages, ${doc1.flashcards.length} cards, ${doc1.quiz.length} quiz Qs)`);
  console.log(`      2. ${doc2.originalName} (${doc2.pageCount} pages, ${doc2.flashcards.length} cards, ${doc2.quiz.length} quiz Qs)`);

  // 5. Seed CardReview states (SuperMemo SM-2)
  const now = Date.now();
  const dayMs = 86400000;

  const cardReviews = [
    // Doc 1 Cards
    {
      userId: demoUser._id,
      documentId: doc1._id,
      cardId: computeCardId(doc1.flashcards[0].question),
      repetition: 3,
      interval: 6,
      easeFactor: 2.5,
      dueDate: new Date(now + dayMs * 3),
      lastReviewed: new Date(now - dayMs * 3),
      history: [{ rating: 3, reviewedAt: new Date(now - dayMs * 3), interval: 6, easeFactor: 2.5 }],
    },
    {
      userId: demoUser._id,
      documentId: doc1._id,
      cardId: computeCardId(doc1.flashcards[1].question),
      repetition: 2,
      interval: 1,
      easeFactor: 2.35,
      dueDate: new Date(now + dayMs * 1),
      lastReviewed: new Date(now - dayMs * 1),
      history: [{ rating: 2, reviewedAt: new Date(now - dayMs * 1), interval: 1, easeFactor: 2.35 }],
    },
    {
      // DUE TODAY
      userId: demoUser._id,
      documentId: doc1._id,
      cardId: computeCardId(doc1.flashcards[2].question),
      repetition: 1,
      interval: 1,
      easeFactor: 2.2,
      dueDate: new Date(now - 3600000 * 2), // 2 hours ago
      lastReviewed: new Date(now - dayMs * 1),
      history: [{ rating: 1, reviewedAt: new Date(now - dayMs * 1), interval: 1, easeFactor: 2.2 }],
    },
    {
      // DUE TODAY
      userId: demoUser._id,
      documentId: doc1._id,
      cardId: computeCardId(doc1.flashcards[3].question),
      repetition: 2,
      interval: 3,
      easeFactor: 2.5,
      dueDate: new Date(now - 3600000 * 5), // 5 hours ago
      lastReviewed: new Date(now - dayMs * 3),
      history: [{ rating: 3, reviewedAt: new Date(now - dayMs * 3), interval: 3, easeFactor: 2.5 }],
    },
    {
      userId: demoUser._id,
      documentId: doc1._id,
      cardId: computeCardId(doc1.flashcards[4].question),
      repetition: 4,
      interval: 15,
      easeFactor: 2.65,
      dueDate: new Date(now + dayMs * 10),
      lastReviewed: new Date(now - dayMs * 5),
      history: [{ rating: 4, reviewedAt: new Date(now - dayMs * 5), interval: 15, easeFactor: 2.65 }],
    },
    {
      userId: demoUser._id,
      documentId: doc1._id,
      cardId: computeCardId(doc1.flashcards[5].question),
      repetition: 1,
      interval: 1,
      easeFactor: 2.5,
      dueDate: new Date(now + dayMs * 2),
      lastReviewed: new Date(now - dayMs * 1),
      history: [{ rating: 3, reviewedAt: new Date(now - dayMs * 1), interval: 1, easeFactor: 2.5 }],
    },
    // Doc 2 Cards
    {
      userId: demoUser._id,
      documentId: doc2._id,
      cardId: computeCardId(doc2.flashcards[0].question),
      repetition: 3,
      interval: 6,
      easeFactor: 2.5,
      dueDate: new Date(now + dayMs * 4),
      lastReviewed: new Date(now - dayMs * 2),
      history: [{ rating: 3, reviewedAt: new Date(now - dayMs * 2), interval: 6, easeFactor: 2.5 }],
    },
    {
      userId: demoUser._id,
      documentId: doc2._id,
      cardId: computeCardId(doc2.flashcards[1].question),
      repetition: 4,
      interval: 12,
      easeFactor: 2.6,
      dueDate: new Date(now + dayMs * 8),
      lastReviewed: new Date(now - dayMs * 4),
      history: [{ rating: 4, reviewedAt: new Date(now - dayMs * 4), interval: 12, easeFactor: 2.6 }],
    },
    {
      userId: demoUser._id,
      documentId: doc2._id,
      cardId: computeCardId(doc2.flashcards[2].question),
      repetition: 2,
      interval: 3,
      easeFactor: 2.5,
      dueDate: new Date(now + dayMs * 2),
      lastReviewed: new Date(now - dayMs * 1),
      history: [{ rating: 3, reviewedAt: new Date(now - dayMs * 1), interval: 3, easeFactor: 2.5 }],
    },
    {
      userId: demoUser._id,
      documentId: doc2._id,
      cardId: computeCardId(doc2.flashcards[3].question),
      repetition: 3,
      interval: 7,
      easeFactor: 2.5,
      dueDate: new Date(now + dayMs * 5),
      lastReviewed: new Date(now - dayMs * 2),
      history: [{ rating: 3, reviewedAt: new Date(now - dayMs * 2), interval: 7, easeFactor: 2.5 }],
    },
  ];

  await CardReview.insertMany(cardReviews);
  console.log('\n[3/6] Seeded Flashcard SM-2 Review States:');
  console.log('      - 10 cards seeded');
  console.log('      - 2 cards currently due today for review');
  console.log('      - 8 cards scheduled for future active recall intervals');

  // 6. Seed Quiz Attempts (Attempt 1: 40%, Attempt 2: 80%, Attempt 3: 100%)
  const attempts = [
    {
      userId: demoUser._id,
      documentId: doc1._id,
      score: 40,
      totalQuestions: 5,
      correctCount: 2,
      isTargeted: false,
      createdAt: new Date(now - dayMs * 3),
      answers: [
        {
          question: doc1.quiz[0].question,
          selectedOption: '3 nodes',
          correctOption: '3 nodes',
          isCorrect: true,
          topic: 'Consensus Foundations',
        },
        {
          question: doc1.quiz[1].question,
          selectedOption: 'Fixed priority IDs assigned to hardware',
          correctOption: 'Randomized election timeouts (150ms-300ms)',
          isCorrect: false,
          topic: 'Raft Leader Election',
        },
        {
          question: doc1.quiz[2].question,
          selectedOption: 'It becomes leader immediately',
          correctOption: 'It does not become leader and waits for timeout to initiate a new term',
          isCorrect: false,
          topic: 'Raft Leader Election',
        },
        {
          question: doc1.quiz[3].question,
          selectedOption: 'Its clock stops ticking',
          correctOption: 'It cannot receive acknowledgment from a majority quorum',
          isCorrect: false,
          topic: 'Split-Brain Mitigation',
        },
        {
          question: doc1.quiz[4].question,
          selectedOption: 'f failures',
          correctOption: 'f failures',
          isCorrect: true,
          topic: 'Consensus Foundations',
        },
      ],
    },
    {
      userId: demoUser._id,
      documentId: doc1._id,
      score: 80,
      totalQuestions: 5,
      correctCount: 4,
      isTargeted: false,
      createdAt: new Date(now - dayMs * 1),
      answers: [
        {
          question: doc1.quiz[0].question,
          selectedOption: '3 nodes',
          correctOption: '3 nodes',
          isCorrect: true,
          topic: 'Consensus Foundations',
        },
        {
          question: doc1.quiz[1].question,
          selectedOption: 'Randomized election timeouts (150ms-300ms)',
          correctOption: 'Randomized election timeouts (150ms-300ms)',
          isCorrect: true,
          topic: 'Raft Leader Election',
        },
        {
          question: doc1.quiz[2].question,
          selectedOption: 'It remains a follower',
          correctOption: 'It does not become leader and waits for timeout to initiate a new term',
          isCorrect: false,
          topic: 'Raft Leader Election',
        },
        {
          question: doc1.quiz[3].question,
          selectedOption: 'It cannot receive acknowledgment from a majority quorum',
          correctOption: 'It cannot receive acknowledgment from a majority quorum',
          isCorrect: true,
          topic: 'Split-Brain Mitigation',
        },
        {
          question: doc1.quiz[4].question,
          selectedOption: 'f failures',
          correctOption: 'f failures',
          isCorrect: true,
          topic: 'Consensus Foundations',
        },
      ],
    },
    {
      userId: demoUser._id,
      documentId: doc2._id,
      score: 100,
      totalQuestions: 3,
      correctCount: 3,
      isTargeted: false,
      createdAt: new Date(now - dayMs * 2),
      answers: [
        {
          question: doc2.quiz[0].question,
          selectedOption: 'Memory Management Unit (MMU)',
          correctOption: 'Memory Management Unit (MMU)',
          isCorrect: true,
          topic: 'Address Translation',
        },
        {
          question: doc2.quiz[1].question,
          selectedOption: 'A page fault trap is generated to load the page from disk',
          correctOption: 'A page fault trap is generated to load the page from disk',
          isCorrect: true,
          topic: 'Page Fault Handling',
        },
        {
          question: doc2.quiz[2].question,
          selectedOption: '4 KB',
          correctOption: '4 KB',
          isCorrect: true,
          topic: 'Paging Architecture',
        },
      ],
    },
  ];

  await QuizAttempt.insertMany(attempts);
  console.log('\n[4/6] Seeded Quiz Attempt History:');
  console.log('      - Attempt 1: 40% (Distributed Systems)');
  console.log('      - Attempt 2: 80% (Distributed Systems)');
  console.log('      - Attempt 3: 100% (Operating Systems)');
  console.log('      - Detected Weak Spot: "Raft Leader Election" (25% accuracy, 3 misses)');

  // 7. Seed 7-Day Study Sessions (Focus Timer History)
  const sessions = [
    { daysAgo: 6, minutes: 25, type: 'pomodoro', documentId: doc1._id },
    { daysAgo: 5, minutes: 50, type: 'pomodoro', documentId: doc1._id },
    { daysAgo: 4, minutes: 50, type: 'pomodoro', documentId: doc2._id },
    { daysAgo: 3, minutes: 75, type: 'pomodoro', documentId: doc1._id },
    { daysAgo: 2, minutes: 50, type: 'free_focus', documentId: doc2._id },
    { daysAgo: 1, minutes: 60, type: 'pomodoro', documentId: doc1._id },
    { daysAgo: 0, minutes: 50, type: 'pomodoro', documentId: doc1._id }, // today
  ].map((s) => ({
    userId: demoUser._id,
    documentId: s.documentId,
    durationMinutes: s.minutes,
    type: s.type,
    completedAt: new Date(now - s.daysAgo * dayMs),
  }));

  await StudySession.insertMany(sessions);
  console.log('\n[5/6] Seeded Study Sessions (7 Days):');
  console.log('      - Total Focus Time: 360 minutes');
  console.log("      - Today's Focus:    50 minutes");
  console.log('      - Complete 7-day focus chart populated');

  // 8. Seed Study Tasks
  const tasks = [
    {
      user: demoUser._id,
      title: 'Review Raft leader election notes',
      description: 'Review randomized election timeout mechanics and split-brain mitigation scenarios.',
      subject: 'Distributed Systems',
      priority: 'high',
      completed: true,
      completedAt: new Date(now - 3600000 * 3),
      dueDate: new Date(now),
    },
    {
      user: demoUser._id,
      title: 'Complete OS virtual memory quiz attempt',
      description: 'Practice multi-level paging and TLB translation hardware mechanics.',
      subject: 'Operating Systems',
      priority: 'medium',
      completed: true,
      completedAt: new Date(now - dayMs * 1),
      dueDate: new Date(now - dayMs * 1),
    },
    {
      user: demoUser._id,
      title: 'Review SM-2 flashcards due today',
      description: 'Active recall flashcards for consensus quorums and Paxos prepare phase.',
      subject: 'Active Recall',
      priority: 'high',
      completed: false,
      dueDate: new Date(now),
    },
    {
      user: demoUser._id,
      title: 'Deep-dive Paxos two-phase consensus paper',
      description: 'Study Leslie Lamport classical Paxos paper notes on synod protocol.',
      subject: 'Distributed Systems',
      priority: 'low',
      completed: false,
      dueDate: new Date(now + dayMs * 2),
    },
  ];

  await Task.insertMany(tasks);
  console.log('\n[6/6] Seeded Study Tasks:');
  console.log('      - 2 completed tasks');
  console.log('      - 2 pending tasks');

  // 9. Seed Sample Ask History (Q&A Thread with Citations)
  await AskHistory.create({
    userId: demoUser._id,
    documentId: doc1._id,
    messages: [
      {
        role: 'user',
        content: 'How does Raft prevent split-brain states during a network partition?',
        createdAt: new Date(now - dayMs * 2),
      },
      {
        role: 'assistant',
        content:
          'Raft mitigates split-brain states by requiring all state machine commits to reach a strict majority quorum (N/2 + 1 nodes) before acknowledgment. If a network partition isolates a leader in a minority subset, that leader cannot achieve majority confirmation and therefore cannot commit new log entries. Only a leader operating within the majority partition can commit updates.',
        citations: [
          {
            pageNumber: 3,
            passage: 'Raft mitigates split-brain by requiring log commits to reach a majority quorum before acknowledgment.',
          },
        ],
        createdAt: new Date(now - dayMs * 2),
      },
    ],
  });
  console.log('      - 1 Q&A thread seeded with ground-truth page citation');

  await mongoose.disconnect();

  console.log('\n========================================================================================');
  console.log('Demo data successfully seeded!');
  console.log('You can now log in to FileSense with:');
  console.log(`  Email:    ${demoEmail}`);
  console.log('  Password: DemoPassword123!');
  console.log('========================================================================================\n');
}

seed().catch((err) => {
  console.error('\n[seed-demo] Fatal error during seeding:', err);
  process.exit(1);
});
