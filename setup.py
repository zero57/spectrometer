#!/usr/bin/python
# -*- coding: utf-8 -*-

# @License EPL-1.0 <http://spdx.org/licenses/EPL-1.0>
##############################################################################
# Copyright (c) 2015 The Linux Foundation and others.
#
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which accompanies this distribution, and is available at
# http://www.eclipse.org/legal/epl-v10.html
##############################################################################

from setuptools import find_packages
from setuptools import setup


setup(
    name='spectrometer',
    version='0.0.1',
    author='OpenDaylight Spectrometer Project',
    author_email='spectrometer-dev@lists.opendaylight.org',
    url='https://wiki.opendaylight.org/view/Spectrometer',
    description='',
    long_description=(
        'The main purpose of Spectrometer is to deliver transparent '
        'statistics of contributions to OpenDaylight Project. It collects '
        'activity data such as 1. commits and number of code lines changed '
        'from ODL Git repositories, 2. reviews from Gerrit, or 3. activities '
        'related to each project from mailing lists and presents the '
        'statistics in a user-friendly manner.'),
    license='EPL',
    classifiers=[
        'Development Status :: 1 - Planning',
        'License :: OSI Approved :: GNU General Public License v3 (GPLv3)',
        'Operating System :: POSIX :: Linux',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3.5',

    ],
    packages=find_packages(exclude=[
        '*.tests',
        '*.tests.*',
        'tests.*',
        'tests'
    ]))