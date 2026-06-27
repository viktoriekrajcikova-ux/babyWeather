import {Container, Row, Col} from "react-bootstrap";
import { Link } from 'react-router-dom';
import styles from './header.module.scss';
import { House, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
    const { signOut } = useAuth();
    const handleSignOut = async () => {
      try {
          await signOut();
      } catch (e) {
          console.error(e);
      }
  };

    return <>
        <div className={styles.header}>
            <Container>
                <Row>
                    <Col className={styles.wrapper}>
                        <Link to="/"><House size={20} strokeWidth={2} />HOME</Link>
                        <Link to="/settings"><Settings size={20} strokeWidth={2} />SETTINGS</Link>
                        <button onClick={handleSignOut} className={styles.signout}>
                            <LogOut size={20} strokeWidth={2} />LOGOUT
                        </button>
                    </Col>
                </Row>
            </Container>
        </div>
    </>
}

export default Header;
