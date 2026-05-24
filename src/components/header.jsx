import React from 'react'
import {Container, Row} from "react-bootstrap";
import Col from "react-bootstrap/Col";
import styles from './header.module.scss'
import { House, Settings } from 'lucide-react';

const Header = () => {
    return <>
        <div className={styles.header}>
            <Container>
                <Row>
                    <Col className={styles.wrapper}>
                        <a href="/" alt="Home"><House size={20} strokeWidth={2} />HOME</a>
                        <a href="/settings" alt="Settings"><Settings size={20} strokeWidth={2} />SETTINGS</a>
                    </Col>
                </Row>
            </Container>
        </div>
    </>
}

export default Header;
