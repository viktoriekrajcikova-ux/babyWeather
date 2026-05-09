import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import {supabaseApi} from "../supabaseApiClient.jsx";
import Message from "./message.jsx";
import { useNavigate } from "react-router-dom";
import styles from './addChildForm.module.scss'


function AddChildForm() {
    const [name, setName] = useState('')
    const [age, setAge] = useState('')
    const [optionsSex] = useState(['male', 'female'])
    const [optionsAge] = useState([0,1,2,3,4,5])
    const [sex, setSex] = useState('')
    const [message, setMessage] = useState('')
    const [variant, setVariant] = useState('primary')
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        setMessage('')

        if (name.length <= 1) {
            setVariant('warning')
            setMessage('Name must be longer than 1 characters')
            return
        }

        if (sex.length < 2) {
            setVariant('warning')
            setMessage('Fill in the sex')
            return
        }

        if (age.length < 1) {
            setVariant('warning')
            setMessage('Fill in the age')
            return
        }

        const newChild = {
            name: name,
            sex: sex,
            age: +age
        }

        supabaseApi.addChild(newChild)
            .then(() => {
                setVariant('success')
                setMessage('Successfully saved')
                setName('')
                event.target.reset()
                }
            )
            .catch(() => {
                setVariant('danger')
                setMessage('Something went wrong')
            });

        setTimeout(() => {
            const message = document.getElementById("message")
            message.style.display = 'none'
            navigate("/");
        }, 2000)

    };

    return (
        <>
            { message && <Message id="message" text={message} variant={variant} /> }
            <Form onSubmit={handleSubmit} className={styles.form}>
                <Row className="mb-3">
                    <Form.Group as={Col}>
                        <Form.Label>First name</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            value={name}
                            onChange={(e) => {setName(e.target.value)}}
                        />
                    </Form.Group>
                </Row>
                <Row className="mb-3">
                    <Form.Group as={Col}>
                        <Form.Label>Age</Form.Label>
                        <Form.Select onChange={(e) => {setAge(e.target.value)}}>
                            <option></option>
                            {optionsAge.map((optionAge, index) => <option key={index}>{optionAge}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Row>
                <Row className="mb-3">
                    <Form.Group as={Col}>
                        <Form.Label>Sex</Form.Label>
                        <Form.Select onChange={(e) => {setSex(e.target.value)}}>
                            <option></option>
                            {optionsSex.map((optionSex, index) => <option key={index}>{optionSex}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Row>
                <div className="mb-3 ">
                    <Button type="submit" className="btn-success">Add child</Button>
                </div>
            </Form>
        </>

    );
}

export default AddChildForm;