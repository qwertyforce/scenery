from distutils.core import setup
from distutils.extension import Extension
from Cython.Distutils import build_ext

setup(
    ext_modules=[
    Extension('hamming_search',
              sources=['hamming_search.pyx'],
              extra_compile_args=['-Ofast', '-march=native', '-fno-wrapv'],
              language='c++')
    ],
  cmdclass = {'build_ext': build_ext}
)