#!/usr/bin/python

import os
import platform
import sys
from common import *

if platform.system() == 'Darwin':
    print('Busco can be run on Linux only')
    sys.exit(0)

name = os.path.basename(__file__)[5:-3]
contigs = [meta_contigs_1, meta_contigs_2]


run_quast(name, contigs=contigs, params='-b')
check_report_files(name)
assert_report_header(name, contigs=contigs)
assert_metric(name, 'Complete conserved orthologs (%)', ['6.76', '6.76'])
assert_metric(name, 'Partial conserved orthologs (%)', ['1.35', '1.35'])