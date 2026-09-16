import ExamGuidePage from './components/ExamGuidePage';
import { omsbExamGuide } from './omsbContent';

export default function OmsbExamPage() {
  return <ExamGuidePage config={omsbExamGuide} />;
}
