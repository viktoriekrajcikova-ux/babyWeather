import React from 'react'
import {Container, Row} from "react-bootstrap";
import Col from "react-bootstrap/Col";
import styles from './header.module.scss'

const Header = () => {
    return <>
        <div className={styles.header}>
            <Container>
                <Row>
                    <Col className={styles.wrapper}>
                        <a href="/" alt="Home"><img src="assets/img/home.png"/>HOME</a>
                        <a href="/settings" alt="Settings"><img src="assets/img/settings.png"/>SETTINGS</a>
                    </Col>
                </Row>
            </Container>
        </div>
    </>
}

export default Header;
