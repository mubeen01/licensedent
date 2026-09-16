import ExamGuidePage from './components/ExamGuidePage';
import { nhraExamGuide } from './nhraContent';

export default function NhraExamPage() {
  return <ExamGuidePage config={nhraExamGuide} />;
}
