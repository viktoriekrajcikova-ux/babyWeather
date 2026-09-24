import AddChildForm from '../../features/children/components/addChildForm/addChildForm';
import Header from '../../app/layout/header';
import { Container } from 'react-bootstrap';

const SettingsScreen = () => {
  return (
    <>
      <Header />
      <Container>
        <h1 className="mb-5 mt-5">Add child</h1>
        <AddChildForm />
      </Container>
    </>
  );
};

export default SettingsScreen;
