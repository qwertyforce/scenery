
from __future__ import print_function
cimport cython

from libc.stdint cimport uint64_t
from libcpp.vector cimport vector
from libcpp.pair cimport pair

cdef extern int __builtin_popcountll(unsigned long long) nogil

cdef extern from "<algorithm>" namespace "std":
    void partial_sort[RandomAccessIterator](RandomAccessIterator first, RandomAccessIterator middle, RandomAccessIterator last) nogil

@cython.boundscheck(False)
@cython.wraparound(False)
cdef vector[pair[ int, int ]] _hamming_knn(uint64_t[:] arr1,uint64_t[:,:] arr2,int[:] image_ids,int n) nogil:
    cdef vector[pair[ int, int ]] v=vector[pair[ int, int ]](arr2.shape[0])
    cdef int i,j=0
    cdef int sum=0
    for i in range(arr2.shape[0]):
        sum=0
        for j in range(4):
            sum+=__builtin_popcountll(arr1[j]^arr2[i][j])
        v[i]=pair[ int, int ](sum, image_ids[i])
    partial_sort[vector[pair[ int, int ]].iterator](v.begin(), v.begin()+n, v.end())
    v.resize(n)
    return v

@cython.boundscheck(False)
@cython.wraparound(False)
cdef vector[pair[ int, int ]] _hamming_range_query(uint64_t[:] arr1,uint64_t[:,:] arr2,int[:] image_ids,int query_range) nogil:
    cdef vector[pair[ int, int ]] v
    cdef int i,j=0
    cdef int sum=0
    for i in range(arr2.shape[0]):
        sum=0
        for j in range(4):
            sum+=__builtin_popcountll(arr1[j]^arr2[i][j])
        if sum<=query_range:
            v.push_back(pair[ int, int ](sum, image_ids[i]))
    return v

def hamming_knn(uint64_t[:] array,uint64_t[:,:] array2,int[:] image_ids,int n):
    return _hamming_knn(array,array2,image_ids,n)

def hamming_range_query(uint64_t[:] array,uint64_t[:,:] array2,int[:] image_ids,int query_range):
    return _hamming_range_query(array,array2,image_ids,query_range)