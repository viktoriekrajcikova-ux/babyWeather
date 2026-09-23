import type { FormEvent } from 'react';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { useAddChild } from '../../hooks/api/useAddChild';
import Message from '../message/message';
import { useNavigate } from 'react-router-dom';
import styles from './addChildForm.module.scss';
import { addChildSchema } from '../schema/addChildForm.schema';
import { z } from 'zod';

type FieldErrors = {
  name?: string[];
  age?: string[];
  sex?: string[];
};

const optionsSex = ['male', 'female'];
const optionsAge = [0, 1, 2, 3, 4, 5];

function AddChildForm() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState('primary');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { addChild, isPending } = useAddChild();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isPending) return;

    setMessage('');
    setFieldErrors({});
    const result = addChildSchema.safeParse({ name, age, sex });

    if (!result.success) {
      setFieldErrors(z.flattenError(result.error).fieldErrors);
      return;
    }

    try {
      await addChild(result.data);
      navigate('/');
    } catch {
      setVariant('danger');
      setMessage('Something went wrong');
    }
  };

  return (
    <>
      {message && <Message id="message" text={message} variant={variant} />}
      <Form onSubmit={handleSubmit} className={styles.form} noValidate>
        <Row className="mb-3">
          <Form.Group as={Col} controlId="childName">
            <Form.Label>First name</Form.Label>
            <Form.Control
              required
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              isInvalid={!!fieldErrors.name?.length}
              aria-invalid={!!fieldErrors.name?.length}
              aria-describedby={fieldErrors.name?.length ? 'childNameError' : undefined}
            />
            <Form.Control.Feedback type="invalid" id="childNameError">
              {fieldErrors.name?.[0]}
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
        <Row className="mb-3">
          <Form.Group as={Col} controlId="childAge">
            <Form.Label>Age</Form.Label>
            <Form.Select
              onChange={(e) => {
                setAge(e.target.value);
              }}
              isInvalid={!!fieldErrors.age?.length}
              value={age}
              aria-invalid={!!fieldErrors.age?.length}
              aria-describedby={fieldErrors.age?.length ? 'childAgeError' : undefined}
            >
              <option></option>
              {optionsAge.map((optionAge, index) => (
                <option key={index}>{optionAge}</option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid" id="childAgeError">
              {fieldErrors.age?.[0]}
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
        <Row className="mb-3">
          <Form.Group as={Col} controlId="childSex">
            <Form.Label>Sex</Form.Label>
            <Form.Select
              onChange={(e) => {
                setSex(e.target.value);
              }}
              isInvalid={!!fieldErrors.sex?.length}
              value={sex}
              aria-invalid={!!fieldErrors.sex?.length}
              aria-describedby={fieldErrors.sex?.length ? 'childSexError' : undefined}
            >
              <option></option>
              {optionsSex.map((optionSex, index) => (
                <option key={index}>{optionSex}</option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid" id="childSexError">
              {fieldErrors.sex?.[0]}
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
        <div className="mb-3 ">
          <Button type="submit" className="btn-success" disabled={isPending}>
            {isPending ? 'Saving...' : 'Add child'}
          </Button>
        </div>
      </Form>
    </>
  );
}

export default AddChildForm;
