/**
 * Knowledge Graph Datasets for SmartEdu OS
 * Includes:
 * 1. Module A: C Programming, Pointers & Data Structures (CS / IT Core)
 * 2. Module B: Engineering Physics - Wave Optics & Diffraction (First Year Core)
 */

export const CURRICULA = [
  { id: 'cs_c_dsa', name: 'C Programming & Data Structures', code: 'CS201', icon: 'Terminal' },
  { id: 'eng_physics', name: 'Engineering Physics: Wave Optics', code: 'PH101', icon: 'Activity' }
];

export const KNOWLEDGE_GRAPH_DATA = {
  cs_c_dsa: {
    title: 'C Programming, Memory Architecture & Data Structures',
    description: 'Undergraduate core curriculum covering low-level RAM management to tree structures.',
    nodes: [
      {
        id: 'c_memory',
        name: 'Memory Architecture & Hex Addresses',
        category: 'FOUNDATION',
        initialMastery: 42, // Weak prerequisite
        examWeight: 8,
        prerequisites: [],
        x: 60, y: 120,
        summary: 'Stack vs Heap memory layout, physical RAM cells, 32-bit vs 64-bit addressing.',
        diagnosticQuestion: {
          question: 'In a 64-bit operating system, what is the size of a pointer variable in memory?',
          options: ['2 bytes', '4 bytes', '8 bytes', 'Depends on whether it points to char or double'],
          correctIndex: 2,
          difficulty: -0.8,
          discrimination: 1.4,
          misconceptionNote: 'Many students think pointer size depends on the data type it points to. In fact, all pointers on 64-bit architecture are 8 bytes because they store 64-bit RAM addresses.'
        }
      },
      {
        id: 'c_variables',
        name: 'Variables & Data Types',
        category: 'FOUNDATION',
        initialMastery: 84,
        examWeight: 6,
        prerequisites: [],
        x: 60, y: 260,
        summary: 'Primitive data types (char, int, float, double), size, signed/unsigned representation.',
        diagnosticQuestion: {
          question: 'What happens if you assign 300 to an unsigned 8-bit char variable in C?',
          options: ['Compiler Error', 'Value wraps around to 44', 'Value clamps to 255', 'Undefined Behavior'],
          correctIndex: 1,
          difficulty: -0.5,
          discrimination: 1.2,
          misconceptionNote: 'Unsigned arithmetic wraps modulo 256 (300 % 256 = 44).'
        }
      },
      {
        id: 'c_pointers',
        name: 'Pointers & Dereferencing',
        category: 'CORE_BOTTLENECK',
        initialMastery: 38, // ⚠️ Major bottleneck
        examWeight: 18,
        prerequisites: ['c_memory', 'c_variables'],
        x: 240, y: 180,
        summary: 'Address-of operator (&), dereference operator (*), indirect memory read/write.',
        diagnosticQuestion: {
          question: 'Given: int a = 20; int *p = &a; *p = 50; What is the value of variable a?',
          options: ['20', '50', 'Address of a', 'Segmentation fault'],
          correctIndex: 1,
          difficulty: 0.2,
          discrimination: 1.8,
          misconceptionNote: 'Dereferencing *p = 50 writes directly to the memory address stored in p, mutating variable a.'
        }
      },
      {
        id: 'c_pointer_arith',
        name: 'Pointer Arithmetic & Arrays',
        category: 'INTERMEDIATE',
        initialMastery: 52,
        examWeight: 14,
        prerequisites: ['c_pointers'],
        x: 420, y: 100,
        summary: 'Array decay to pointer, scaling by sizeof(T), indexing equivalence arr[i] == *(arr + i).',
        diagnosticQuestion: {
          question: 'If int *ptr = 0x2000 on a system where sizeof(int) == 4, what is the value of (ptr + 3)?',
          options: ['0x2003', '0x200C', '0x2012', '0x2004'],
          correctIndex: 1,
          difficulty: 0.6,
          discrimination: 1.9,
          misconceptionNote: 'Pointer arithmetic increments in multiples of the type size. 3 * 4 = 12 bytes = 0x0C in hex. 0x2000 + 0x0C = 0x200C.'
        }
      },
      {
        id: 'c_dynamic_mem',
        name: 'Dynamic Memory (malloc/free)',
        category: 'INTERMEDIATE',
        initialMastery: 46,
        examWeight: 16,
        prerequisites: ['c_pointers'],
        x: 420, y: 260,
        summary: 'Heap allocation with malloc, calloc, realloc, memory leaks, and dangling pointers.',
        diagnosticQuestion: {
          question: 'What is the consequence of freeing a pointer but continuing to read *ptr later?',
          options: ['Automatic memory reallocation', 'Dangling pointer / Undefined Behavior', 'Clean zero return', 'Compilation error'],
          correctIndex: 1,
          difficulty: 0.7,
          discrimination: 1.6,
          misconceptionNote: 'Using freed memory accesses undefined heap space, which can cause security exploits or random crashes.'
        }
      },
      {
        id: 'c_structs',
        name: 'Structures & Self-Referential Types',
        category: 'INTERMEDIATE',
        initialMastery: 65,
        examWeight: 12,
        prerequisites: ['c_variables'],
        x: 240, y: 340,
        summary: 'struct syntax, alignment padding, member access with dot and arrow (->) operators.',
        diagnosticQuestion: {
          question: 'Why does a Node struct in C require a pointer to itself (struct Node *next) instead of an instance (struct Node next)?',
          options: ['C does not allow structs inside structs', 'An instance would require infinite memory recursion', 'Pointers are faster than structs', 'Dot operator cannot be used in loops'],
          correctIndex: 1,
          difficulty: 0.4,
          discrimination: 1.5,
          misconceptionNote: 'A struct containing an instance of itself would have undefined, infinitely recursive size.'
        }
      },
      {
        id: 'c_linked_lists',
        name: 'Singly & Doubly Linked Lists',
        category: 'ADVANCED',
        initialMastery: 28, // Blocked because pointers is 38%
        examWeight: 20,
        prerequisites: ['c_dynamic_mem', 'c_structs'],
        x: 600, y: 180,
        summary: 'Node insertion, deletion, head pointer manipulation, cycle detection, memory management.',
        diagnosticQuestion: {
          question: 'To insert a new node newNode between curr and curr->next, which step must happen first?',
          options: [
            'curr->next = newNode;',
            'newNode->next = curr->next;',
            'free(curr);',
            'newNode = curr->next;'
          ],
          correctIndex: 1,
          difficulty: 0.9,
          discrimination: 2.1,
          misconceptionNote: 'If you set curr->next = newNode first, you lose the reference to the rest of the list!'
        }
      },
      {
        id: 'c_trees',
        name: 'Binary Search Trees & Traversal',
        category: 'ADVANCED',
        initialMastery: 15,
        examWeight: 22,
        prerequisites: ['c_linked_lists'],
        x: 780, y: 180,
        summary: 'Recursive BST insertion, inorder/preorder/postorder traversals, search complexity O(log N).',
        diagnosticQuestion: {
          question: 'Which tree traversal order visits a Binary Search Tree in strictly ascending sorted order?',
          options: ['Preorder (Root, Left, Right)', 'Inorder (Left, Root, Right)', 'Postorder (Left, Right, Root)', 'Level Order'],
          correctIndex: 1,
          difficulty: 0.8,
          discrimination: 1.7,
          misconceptionNote: 'Inorder traversal recursively visits Left subtree (smaller), Root, then Right subtree (larger).'
        }
      }
    ]
  },

  eng_physics: {
    title: 'Engineering Physics: Wave Optics & Fraunhofer Diffraction',
    description: 'First year engineering core covering interference, wave superposition, and diffraction patterns.',
    nodes: [
      {
        id: 'ph_wave_motion',
        name: 'Wave Motion & Phase',
        category: 'FOUNDATION',
        initialMastery: 75,
        examWeight: 8,
        prerequisites: [],
        x: 60, y: 150,
        summary: 'Harmonic waves, frequency, wave number k = 2pi/lambda, phase difference.',
        diagnosticQuestion: {
          question: 'If two identical waves are out of phase by pi radians (180 degrees), what is the resulting amplitude?',
          options: ['Double the amplitude', 'Zero (complete cancellation)', 'Square root of 2 times amplitude', 'Unaffected'],
          correctIndex: 1,
          difficulty: -0.6,
          discrimination: 1.3,
          misconceptionNote: '180 degree phase difference leads to destructive interference with net zero amplitude.'
        }
      },
      {
        id: 'ph_path_diff',
        name: 'Path Difference & Superposition',
        category: 'FOUNDATION',
        initialMastery: 44, // ⚠️ Prerequisite gap
        examWeight: 12,
        prerequisites: ['ph_wave_motion'],
        x: 220, y: 150,
        summary: 'Relation between path difference delta x and phase difference phi = (2pi/lambda) * delta x.',
        diagnosticQuestion: {
          question: 'For constructive interference between two coherent sources, the path difference must be:',
          options: ['(n + 0.5) * lambda', 'n * lambda (where n is an integer)', 'n * lambda / 4', 'Zero only'],
          correctIndex: 1,
          difficulty: 0.1,
          discrimination: 1.6,
          misconceptionNote: 'Path difference of integer wavelengths produces crest-on-crest constructive interference.'
        }
      },
      {
        id: 'ph_diffraction_single_slit',
        name: 'Single-Slit Fraunhofer Diffraction',
        category: 'CORE_BOTTLENECK',
        initialMastery: 32, // ⚠️ Major bottleneck
        examWeight: 24,
        prerequisites: ['ph_path_diff'],
        x: 420, y: 150,
        summary: 'Slit width a, condition for minima: a sin(theta) = m * lambda, central maximum angular width.',
        diagnosticQuestion: {
          question: 'In single-slit diffraction, what is the condition for the first minimum (m = 1)?',
          options: ['a sin(theta) = 0.5 * lambda', 'a sin(theta) = lambda', 'a sin(theta) = 2 * lambda', 'a cos(theta) = lambda'],
          correctIndex: 1,
          difficulty: 0.5,
          discrimination: 2.0,
          misconceptionNote: 'When path difference between wavelets from top and bottom of the slit equals lambda, every wavelet cancels with one from the lower half.'
        }
      },
      {
        id: 'ph_intensity_profile',
        name: 'Diffraction Intensity Envelope',
        category: 'INTERMEDIATE',
        initialMastery: 25,
        examWeight: 16,
        prerequisites: ['ph_diffraction_single_slit'],
        x: 600, y: 100,
        summary: 'Intensity formula I(theta) = I_0 * [sin(beta)/beta]^2 where beta = (pi * a / lambda) * sin(theta).',
        diagnosticQuestion: {
          question: 'What fraction of the central maximum intensity is the first secondary maximum roughly equal to?',
          options: ['50%', '25%', '4.7%', '0.1%'],
          correctIndex: 2,
          difficulty: 0.9,
          discrimination: 1.5,
          misconceptionNote: 'The first secondary peak is only (2 / 3pi)^2 ≈ 4.7% of the central maximum intensity.'
        }
      },
      {
        id: 'ph_resolving_power',
        name: 'Rayleigh Criterion & Resolving Power',
        category: 'ADVANCED',
        initialMastery: 18,
        examWeight: 20,
        prerequisites: ['ph_intensity_profile'],
        x: 780, y: 150,
        summary: 'Limit of resolution theta_min = 1.22 * lambda / D for circular apertures (telescopes/microscopes).',
        diagnosticQuestion: {
          question: 'Why do larger telescope apertures provide sharper astronomical images?',
          options: ['They collect more thermal energy', 'They decrease angular diffraction limit theta_min', 'They reduce light speed', 'They eliminate atmospheric reflection'],
          correctIndex: 1,
          difficulty: 0.8,
          discrimination: 1.7,
          misconceptionNote: 'Angular resolution is inversely proportional to aperture diameter D (theta_min = 1.22 lambda / D).'
        }
      }
    ]
  }
};
