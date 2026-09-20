import { redirect } from 'next/navigation';

interface EstimationPageProps {
  params: {
    locale: string;
  };
}

export default function EstimationPage({ params }: EstimationPageProps) {
  redirect(`/${params.locale}/cities/casablanca/estimate`);
}
