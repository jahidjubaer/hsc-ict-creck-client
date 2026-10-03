import { BlockRenderer } from '@/components/lesson/BlockRenderer';

// Dev-only page (/dev/widgets): every lab with typical props, for checking widgets while writing lessons.
const BLOCKS = [
  ...['bus', 'ring', 'star', 'tree', 'mesh', 'hybrid'].map((type) => ({ type: 'widget', name: 'TopologyLab', props: { type } })),
  { type: 'widget', name: 'NetworkDeviceLab', props: { mode: 'lan' } },
  { type: 'widget', name: 'NetworkDeviceLab', props: { mode: 'join' } },
  ...['method', 'framing', 'mode', 'delivery', 'bandwidth'].map((mode) => ({ type: 'widget', name: 'TransmissionLab', props: { mode } })),
  { type: 'widget', name: 'SqlPlayground', props: {} },
  {
    type: 'widget',
    name: 'SqlPlayground',
    props: {
      setup: 'join',
      code: 'SELECT name, roll, subject, marks FROM result, student_info WHERE result.roll = student_info.roll;',
      tasks: [
        { text: 'রোল 1-এর ফলাফল নামসহ দেখাও', solution: 'SELECT name, result.roll, subject, marks FROM result, student_info WHERE result.roll = 1 AND result.roll = student_info.roll;' },
        { text: 'রোল 2-এর Bangla নম্বর 78 করো', solution: "UPDATE result SET marks = 78 WHERE roll = 2 AND subject = 'Bangla';", check: 'SELECT * FROM result' },
      ],
    },
  },
  { type: 'widget', name: 'RelationLab', props: { mode: 'key' } },
  { type: 'widget', name: 'RelationLab', props: { preset: 'one-one' } },
  { type: 'widget', name: 'RelationLab', props: { preset: 'many-many' } },
  { type: 'widget', name: 'RelationLab', props: { preset: 'teacher', quiz: true } },
  { type: 'widget', name: 'SortLab', props: { order: 'section, class DESC, roll' } },
  { type: 'widget', name: 'IndexLab', props: {} },
  { type: 'widget', name: 'CipherLab', props: { mode: 'caesar' } },
  { type: 'widget', name: 'CipherLab', props: { mode: 'transposition' } },
  { type: 'widget', name: 'CipherLab', props: { mode: 'keys' } },
  { type: 'widget', name: 'CTracer', props: {} },
  { type: 'widget', name: 'CTracer', props: { code: `#include <stdio.h>
int main()
{
    int marks;
    scanf("%d", &marks);
    if (marks >= 80)
        printf("A+");
    else if (marks >= 70)
        printf("A");
    else
        printf("F");
    return 0;
}`, input: '75', predict: true } },
  ...['college', 'c-to-f', 'max2', 'count', 'table', 'sum-odd', 'factorial', 'even-odd', 'max3', 'search'].map((preset) => ({ type: 'widget', name: 'FlowchartLab', props: { preset } })),
  {
    type: 'widget',
    name: 'HtmlEditor',
    props: {
      code: `<!DOCTYPE html>
<html>
<head>
  <title>Lab</title>
</head>
<body>
  <p><em>Abracadabra</p></em>
  <img src="image.jpg" width="150">
</body>
</html>`,
      tasks: [
        { text: 'একটি h1 হেডিং যোগ করো', selector: 'h1' },
        { text: 'ছবিটির উচ্চতা 100 করো', selector: 'img[height="100"]' },
      ],
    },
  },
  { type: 'widget', name: 'TableBuilder', props: { preset: 'bill' } },
  { type: 'widget', name: 'TableBuilder', props: { target: 'bill' } },
  { type: 'widget', name: 'BinaryCalculator', props: { op: 'add', a: '101100101', b: '11001001' } },
  { type: 'widget', name: 'BinaryCalculator', props: { op: 'sub', a: '101100101', b: '11001001' } },
  { type: 'widget', name: 'ComplementLab', props: { mode: 'represent', value: '-25', bits: 8 } },
  { type: 'widget', name: 'ComplementLab', props: { mode: 'subtract', a: '25', b: '50', bits: 8 } },
  { type: 'widget', name: 'CodeLab', props: { mode: 'bcd', value: '25' } },
  { type: 'widget', name: 'CodeLab', props: { mode: 'unicode', value: 'বাংলা' } },
  { type: 'widget', name: 'TruthTable', props: { expr: "(A+B)'", compare: "A'B'" } },
  { type: 'widget', name: 'TruthTable', props: { expr: "A'B + AB'", steps: true } },
  { type: 'widget', name: 'EncoderDecoderLab', props: { type: 'decoder', size: 3 } },
  { type: 'widget', name: 'EncoderDecoderLab', props: { type: 'encoder', size: 8 } },
  { type: 'widget', name: 'AdderLab', props: { type: 'half' } },
  { type: 'widget', name: 'AdderLab', props: { type: 'full' } },
  { type: 'widget', name: 'AdderLab', props: { type: 'parallel' } },
  { type: 'widget', name: 'SequentialLab', props: { type: 'sr' } },
  { type: 'widget', name: 'SequentialLab', props: { type: 'd' } },
  { type: 'widget', name: 'SequentialLab', props: { type: 'shift' } },
  { type: 'widget', name: 'SequentialLab', props: { type: 'counter' } },
];

export default function WidgetGallery() {
  return (
    <div className="mx-auto max-w-3xl px-3 py-8">
      <h1 className="mb-6 text-2xl font-bold">Widget gallery (dev)</h1>
      <BlockRenderer blocks={BLOCKS} />
    </div>
  );
}
