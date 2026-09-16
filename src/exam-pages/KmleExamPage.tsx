import ExamGuidePage from './components/ExamGuidePage';
import { kmleExamGuide } from './kmleContent';

export default function KmleExamPage() {
  return <ExamGuidePage config={kmleExamGuide} />;
}
