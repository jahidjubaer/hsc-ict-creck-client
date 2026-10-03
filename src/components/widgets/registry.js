import { lazy } from 'react';

// Interactive widgets that lesson blocks can embed by name: { type: 'widget', name: 'NumberConverter', props: {...} }
// Lazy-loaded so a topic only downloads the labs it uses. Props are documented in docs/CONTENT_GUIDE.md.
const load = (file, name) => lazy(() => file().then((m) => ({ default: m[name] })));

export const WIDGETS = {
  NumberConverter: load(() => import('./NumberConverter'), 'NumberConverter'),
  LogicGateLab: load(() => import('./LogicGateLab'), 'LogicGateLab'),
  BinaryCalculator: load(() => import('./BinaryCalculator'), 'BinaryCalculator'),
  ComplementLab: load(() => import('./ComplementLab'), 'ComplementLab'),
  CodeLab: load(() => import('./CodeLab'), 'CodeLab'),
  TruthTable: load(() => import('./TruthTable'), 'TruthTable'),
  EncoderDecoderLab: load(() => import('./EncoderDecoderLab'), 'EncoderDecoderLab'),
  AdderLab: load(() => import('./AdderLab'), 'AdderLab'),
  SequentialLab: load(() => import('./SequentialLab'), 'SequentialLab'),
  HtmlEditor: load(() => import('./HtmlEditor'), 'HtmlEditor'),
  TableBuilder: load(() => import('./TableBuilder'), 'TableBuilder'),
  CTracer: load(() => import('./CTracer'), 'CTracer'),
  FlowchartLab: load(() => import('./FlowchartLab'), 'FlowchartLab'),
  SqlPlayground: load(() => import('./SqlPlayground'), 'SqlPlayground'),
  RelationLab: load(() => import('./RelationLab'), 'RelationLab'),
  SortLab: load(() => import('./SortLab'), 'SortLab'),
  IndexLab: load(() => import('./IndexLab'), 'IndexLab'),
  CipherLab: load(() => import('./CipherLab'), 'CipherLab'),
  TopologyLab: load(() => import('./TopologyLab'), 'TopologyLab'),
  NetworkDeviceLab: load(() => import('./NetworkDeviceLab'), 'NetworkDeviceLab'),
  TransmissionLab: load(() => import('./TransmissionLab'), 'TransmissionLab'),
};

export const WIDGET_TITLES = {
  NumberConverter: 'ইন্টারঅ্যাকটিভ ল্যাব: সংখ্যা রূপান্তর',
  LogicGateLab: 'ইন্টারঅ্যাকটিভ ল্যাব: লজিক গেট',
  BinaryCalculator: 'ইন্টারঅ্যাকটিভ ল্যাব: বাইনারি যোগ-বিয়োগ',
  ComplementLab: 'ইন্টারঅ্যাকটিভ ল্যাব: ২-এর পরিপূরক',
  CodeLab: 'ইন্টারঅ্যাকটিভ ল্যাব: কোড',
  TruthTable: 'ইন্টারঅ্যাকটিভ ল্যাব: সত্যক সারণি',
  EncoderDecoderLab: 'ইন্টারঅ্যাকটিভ ল্যাব: এনকোডার ও ডিকোডার',
  AdderLab: 'ইন্টারঅ্যাকটিভ ল্যাব: অ্যাডার',
  SequentialLab: 'ইন্টারঅ্যাকটিভ ল্যাব: ফ্লিপফ্লপ, রেজিস্টার ও কাউন্টার',
  HtmlEditor: 'লাইভ HTML এডিটর: কোড লেখো, সাথে সাথে দেখো',
  TableBuilder: 'ইন্টারঅ্যাকটিভ ল্যাব: টেবিল বিল্ডার (rowspan ও colspan)',
  CTracer: 'C ল্যাব: চালাও ও ধাপে ধাপে দেখো',
  FlowchartLab: 'ইন্টারঅ্যাকটিভ ল্যাব: ফ্লোচার্ট চালিয়ে দেখো',
  SqlPlayground: 'SQL ল্যাব: কুয়েরি লেখো, চালাও',
  RelationLab: 'ইন্টারঅ্যাকটিভ ল্যাব: টেবিলের সম্পর্ক ও কি',
  SortLab: 'ইন্টারঅ্যাকটিভ ল্যাব: ORDER BY দিয়ে সাজাও',
  IndexLab: 'ইন্টারঅ্যাকটিভ ল্যাব: ইনডেক্স দিয়ে দ্রুত খোঁজা',
  CipherLab: 'ইন্টারঅ্যাকটিভ ল্যাব: এনক্রিপশন',
  TopologyLab: 'ইন্টারঅ্যাকটিভ ল্যাব: নেটওয়ার্ক টপোলজি',
  NetworkDeviceLab: 'ইন্টারঅ্যাকটিভ ল্যাব: নেটওয়ার্ক ডিভাইস',
  TransmissionLab: 'ইন্টারঅ্যাকটিভ ল্যাব: ডেটা ট্রান্সমিশন',
};
