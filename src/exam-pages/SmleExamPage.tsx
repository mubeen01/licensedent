import ExamGuidePage from './components/ExamGuidePage';
import { smleExamGuide } from './smleContent';

export default function SmleExamPage() {
  return <ExamGuidePage config={smleExamGuide} />;
}
