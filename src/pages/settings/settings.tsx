import AddChildForm from '../../modules/children/components/addChildForm/addChildForm';
import Header from '../../app/layout/header';
import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const SettingsScreen = () => {
  const { t } = useTranslation();
  return (
    <>
      <Header />
      <Container>
        <h1 className="mb-5 mt-5">{t('children.add')}</h1>
        <AddChildForm />
      </Container>
    </>
  );
};

export default SettingsScreen;
