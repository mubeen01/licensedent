import ExamGuidePage from './components/ExamGuidePage';
import { dhaExamGuide } from './dhaContent';

export default function DhaExamPage() {
  return <ExamGuidePage config={dhaExamGuide} />;
}
