import ExamGuidePage from './components/ExamGuidePage';
import { qchpExamGuide } from './qchpContent';

export default function QchpExamPage() {
  return <ExamGuidePage config={qchpExamGuide} />;
}
