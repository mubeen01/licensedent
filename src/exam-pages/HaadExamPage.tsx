import ExamGuidePage from './components/ExamGuidePage';
import { haadExamGuide } from './haadContent';

export default function HaadExamPage() {
  return <ExamGuidePage config={haadExamGuide} />;
}
