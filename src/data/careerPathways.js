/**
 * Career Pathways & Industry Skill Alignment Data
 * Maps academic subjects directly to industry roles, required practical skills,
 * and Learn -> Build -> Prove project templates.
 */

export const CAREER_ROLES = [
  {
    id: 'systems_engineer',
    title: 'Systems & Embedded Software Engineer',
    targetSalaries: '₹12 LPA - ₹32 LPA',
    description: 'Builds operating system kernels, device drivers, real-time embedded firmware, and low-latency storage engines.',
    demandLevel: 'Very High',
    primaryLanguage: 'C / C++ / Rust',
    requiredSkills: [
      { name: 'Manual Memory Allocation & Pointers', academicSource: 'c_pointers', requiredLevel: 85 },
      { name: 'Pointer Arithmetic & Cache Locality', academicSource: 'c_pointer_arith', requiredLevel: 80 },
      { name: 'Custom Heap Allocators (malloc/free internals)', academicSource: 'c_dynamic_mem', requiredLevel: 90 },
      { name: 'Low-Level Linked Lists & Ring Buffers', academicSource: 'c_linked_lists', requiredLevel: 85 },
      { name: 'Memory Leaks & Valgrind Profiling', academicSource: 'c_memory', requiredLevel: 80 }
    ],
    proofProject: {
      id: 'proj_slab_allocator',
      title: 'Build a Custom Slab Memory Allocator in C',
      difficulty: 'Hard',
      estimatedHours: 6,
      badgeName: 'Systems Memory Craftsman',
      objective: 'Implement a memory pool slab allocator using raw pointer manipulation to avoid heap fragmentation.',
      milestones: [
        { id: 'm1', name: 'Initialize raw contiguous byte buffer using virtual memory', points: 25 },
        { id: 'm2', name: 'Implement free-list tracking using pointer metadata tags', points: 30 },
        { id: 'm3', name: 'Allocate fixed-size 64-byte chunks with zero fragmentation', points: 25 },
        { id: 'm4', name: 'Implement boundary tag coalesce on memory free', points: 20 }
      ],
      starterCode: `// SmartEdu OS: Custom Slab Memory Allocator
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define POOL_SIZE 1024
#define BLOCK_SIZE 64

typedef struct Block {
    struct Block *next;
} Block;

static char memory_pool[POOL_SIZE];
static Block *free_list = NULL;

void slab_init() {
    // TODO: Slice memory_pool into BLOCK_SIZE linked chunks
    printf("[System] Slab allocator initialized with %d bytes\\n", POOL_SIZE);
}

void* slab_alloc() {
    // TODO: Return first free block from free_list
    return NULL;
}

void slab_free(void *ptr) {
    // TODO: Re-attach freed block to head of free_list
}

int main() {
    slab_init();
    printf("Ready for allocation test!\\n");
    return 0;
}`,
      testCases: [
        { input: 'slab_alloc() x 4', expected: '4 contiguous 64-byte chunks with unique addresses' },
        { input: 'slab_free(block2)', expected: 'block2 successfully returned to free list' },
        { input: 'slab_alloc() after free', expected: 'Reuses block2 address immediately' }
      ]
    }
  },

  {
    id: 'ai_systems_engineer',
    title: 'AI / ML Infrastructure Engineer',
    targetSalaries: '₹18 LPA - ₹45 LPA',
    description: 'Designs GPU tensor runtimes, CUDA kernel memory management, and distributed training pipelines.',
    demandLevel: 'Critical',
    primaryLanguage: 'C++ / CUDA / Python',
    requiredSkills: [
      { name: 'Strided Tensor Pointer Addressing', academicSource: 'c_pointer_arith', requiredLevel: 85 },
      { name: 'Dynamic Memory & Buffer Pooling', academicSource: 'c_dynamic_mem', requiredLevel: 90 },
      { name: 'Binary Trees & Computation Graphs', academicSource: 'c_trees', requiredLevel: 85 },
      { name: 'Linear Memory Layout of Matrices', academicSource: 'c_memory', requiredLevel: 80 }
    ],
    proofProject: {
      id: 'proj_tensor_engine',
      title: 'Build a Micro-Tensor Engine with 2D Pointer Strides',
      difficulty: 'Medium-Hard',
      estimatedHours: 5,
      badgeName: 'Tensor Runtime Architect',
      objective: 'Implement a C-based 2D matrix runtime supporting contiguous flat storage and strided pointer indexing.',
      milestones: [
        { id: 'm1', name: 'Allocate 1D flat array representing 2D tensor', points: 25 },
        { id: 'm2', name: 'Calculate row-major strided offset: offset = r * stride + c', points: 30 },
        { id: 'm3', name: 'Implement in-place transpose using pointer exchange', points: 25 },
        { id: 'm4', name: 'Execute cache-friendly matrix multiplication', points: 20 }
      ],
      starterCode: `// SmartEdu OS: Micro-Tensor 2D Runtime
#include <stdio.h>
#include <stdlib.h>

typedef struct Tensor2D {
    float *data;
    int rows;
    int cols;
    int stride;
} Tensor2D;

Tensor2D* tensor_create(int rows, int cols) {
    Tensor2D *t = (Tensor2D*)malloc(sizeof(Tensor2D));
    t->rows = rows;
    t->cols = cols;
    t->stride = cols;
    t->data = (float*)malloc(rows * cols * sizeof(float));
    return t;
}

float tensor_get(Tensor2D *t, int r, int c) {
    // TODO: Return *(t->data + r * t->stride + c)
    return 0.0f;
}

int main() {
    Tensor2D *t = tensor_create(3, 3);
    printf("Tensor created: 3x3 with stride 3\\n");
    return 0;
}`,
      testCases: [
        { input: 'tensor_create(3, 3)', expected: 'Single 9-float contiguous heap block' },
        { input: 'tensor_get(t, 2, 1)', expected: 'Accesses data[7] correctly' }
      ]
    }
  },

  {
    id: 'optical_engineer',
    title: 'Optical & Semiconductor Hardware Engineer',
    targetSalaries: '₹14 LPA - ₹36 LPA',
    description: 'Develops photolithography optical masks, laser interferometers, fiber optics, and sensor apertures.',
    demandLevel: 'High',
    primaryLanguage: 'MATLAB / Python / C',
    requiredSkills: [
      { name: 'Fraunhofer Single & Double Slit Diffraction', academicSource: 'ph_diffraction_single_slit', requiredLevel: 90 },
      { name: 'Superposition & Phase Differences', academicSource: 'ph_path_diff', requiredLevel: 85 },
      { name: 'Aperture Resolution & Rayleigh Criterion', academicSource: 'ph_resolving_power', requiredLevel: 85 },
      { name: 'Intensity Envelope Calculations', academicSource: 'ph_intensity_profile', requiredLevel: 80 }
    ],
    proofProject: {
      id: 'proj_diffraction_simulator',
      title: 'Simulate Photolithography Optical Mask Diffraction',
      difficulty: 'Medium',
      estimatedHours: 4,
      badgeName: 'Optics & Photolithography Specialist',
      objective: 'Calculate and render the Fraunhofer diffraction intensity profile for sub-micron semiconductor lithography.',
      milestones: [
        { id: 'm1', name: 'Calculate beta parameter = (pi * a / lambda) * sin(theta)', points: 25 },
        { id: 'm2', name: 'Implement sinc envelope I0 * (sin(beta)/beta)^2 with limit at 0', points: 30 },
        { id: 'm3', name: 'Determine first minimum angle theta = arcsin(lambda / a)', points: 25 },
        { id: 'm4', name: 'Verify Rayleigh resolution limit between two adjacent laser spots', points: 20 }
      ],
      starterCode: `// SmartEdu OS: Fraunhofer Optical Mask Diffraction Simulation
import math

def calculate_diffraction_intensity(wavelength_nm, slit_width_um, angle_rad):
    # Convert units: nm to m, um to m
    lam = wavelength_nm * 1e-9
    a = slit_width_um * 1e-6
    
    if abs(angle_rad) < 1e-9:
        return 1.0 # Central maximum limit
        
    beta = (math.pi * a / lam) * math.sin(angle_rad)
    intensity = (math.sin(beta) / beta) ** 2
    return intensity

print("Central Intensity:", calculate_diffraction_intensity(500, 2.0, 0.0))
`,
      testCases: [
        { input: 'angle_rad = 0.0', expected: 'Intensity == 1.0' },
        { input: 'angle_rad at sin(theta) = lambda / a', expected: 'Intensity == 0.0 (First Minimum)' }
      ]
    }
  }
];
