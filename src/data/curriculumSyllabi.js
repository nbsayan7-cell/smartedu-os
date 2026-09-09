/**
 * Sample University Syllabi for 1-Click Ingestion Demo
 */

export const SAMPLE_SYLLABI = [
  {
    id: 'vtu_cs201',
    university: 'Visvesvaraya Technological University (VTU)',
    courseCode: 'CS201',
    courseTitle: 'Data Structures and Applications',
    text: `MODULE 1: INTRODUCTION TO DATA STRUCTURES & POINTERS
Review of C variables, data types, and RAM organization.
Memory architecture: stack vs heap, hex addresses, pointer variables, address-of (&) and dereferencing (*) operators.
Pointer arithmetic: array index equivalence, scaling by sizeof, pointer comparison.
Dynamic Memory Management: malloc(), calloc(), realloc(), and free(). Memory leaks and dangling pointer hazards.
Structures: Definition, memory layout, nested structs, self-referential structures.

MODULE 2: LINKED LISTS
Definition, representation of linked lists in memory.
Types of linked lists: Singly linked list, Doubly linked list, Circular linked list.
Operations: Insertion at beginning/end/middle, deletion of nodes, searching, list reversal.
Applications of linked lists: Polynomial representation, addition of polynomials.

MODULE 3: STACKS AND QUEUES
Stack representation using arrays and dynamic linked lists.
Infix to postfix conversion, evaluation of postfix expressions.
Queues: Linear queue, circular queue, double ended queue (deque), priority queue.

MODULE 4: TREES AND GRAPHS
Trees: Terminology, Binary Trees, properties of Binary Trees.
Binary Search Trees (BST): Insertion, deletion, search operations.
Tree Traversals: Inorder, Preorder, Postorder traversals.
`
  },
  {
    id: 'aktu_ph101',
    university: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
    courseCode: 'KAS101T',
    courseTitle: 'Engineering Physics: Wave Optics & Quantum Mechanics',
    text: `UNIT 1: WAVE OPTICS & INTERFERENCE
Coherent sources, conditions for sustained interference.
Path difference and phase difference relationships.
Division of wave-front and division of amplitude.
Thin film interference, wedge shaped thin films, Newton's rings experiment and determination of wavelength.

UNIT 2: DIFFRACTION OF LIGHT
Distinction between Fresnel and Fraunhofer diffraction.
Fraunhofer diffraction at a single slit: Central maximum, secondary maxima, and condition for minima.
Intensity distribution in single-slit pattern.
Fraunhofer diffraction at a double slit and diffraction grating.
Dispersive power and resolving power of grating. Rayleigh criterion for resolution.
`
  }
];
