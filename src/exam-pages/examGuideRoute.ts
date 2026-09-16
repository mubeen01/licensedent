import { routes } from 'wasp/client/router';

/** Exams with their own detailed guide page (`/exams/<code>`) instead of going straight to signup. */
export function examGuideRoute(code: string | null | undefined) {
  switch (code) {
    case 'DHA':
      return routes.DhaExamRoute.to;
    case 'HAAD':
      return routes.HaadExamRoute.to;
    case 'MOH':
      return routes.MohExamRoute.to;
    case 'SMLE':
      return routes.SmleExamRoute.to;
    case 'OMSB':
      return routes.OmsbExamRoute.to;
    case 'QCHP':
      return routes.QchpExamRoute.to;
    case 'KMLE':
      return routes.KmleExamRoute.to;
    case 'NHRA':
      return routes.NhraExamRoute.to;
    case 'SHA':
      return routes.ShaExamRoute.to;
    case 'IDC':
      return routes.IdcExamRoute.to;
    default:
      return null;
  }
}
