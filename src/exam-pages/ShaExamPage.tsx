import ExamGuidePage from './components/ExamGuidePage';
import { shaExamGuide } from './shaContent';

export default function ShaExamPage() {
  return <ExamGuidePage config={shaExamGuide} />;
}
