import type { FormEvent } from 'react';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useAddChildMutation } from '../../hooks/useAddChildMutation';
import styles from './addChildForm.module.scss';
import { addChildSchema } from './addChildForm.schema';

type FieldErrors = {
  name?: string[];
  age?: string[];
  sex?: string[];
};

const optionsSex = ['male', 'female'] as const;
const optionsAge = [0, 1, 2, 3, 4, 5];

function AddChildForm() {
  const { t } = useTranslation();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { mutate: addChild, isPending } = useAddChildMutation();
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isPending) return;
    setFieldErrors({});
    const formData = new FormData(event.currentTarget);
    const result = addChildSchema.safeParse({
      name: formData.get('name'),
      age: formData.get('age'),
      sex: formData.get('sex'),
    });

    if (!result.success) {
      setFieldErrors(z.flattenError(result.error).fieldErrors);
      return;
    }

    addChild(result.data, { onSuccess: () => navigate('/') });
  };

  return (
    <Form onSubmit={handleSubmit} className={styles.form} noValidate>
      <Row className="mb-3">
        <Form.Group as={Col} controlId="childName">
          <Form.Label>{t('children.firstName')}</Form.Label>
          <Form.Control
            name="name"
            required
            type="text"
            isInvalid={!!fieldErrors.name?.length}
            aria-invalid={!!fieldErrors.name?.length}
            aria-describedby={fieldErrors.name?.length ? 'childNameError' : undefined}
          />
          <Form.Control.Feedback type="invalid" id="childNameError">
            {fieldErrors.name?.[0] && t(fieldErrors.name[0])}
          </Form.Control.Feedback>
        </Form.Group>
      </Row>
      <Row className="mb-3">
        <Form.Group as={Col} controlId="childAge">
          <Form.Label>{t('children.age')}</Form.Label>
          <Form.Select
            name="age"
            isInvalid={!!fieldErrors.age?.length}
            aria-invalid={!!fieldErrors.age?.length}
            aria-describedby={fieldErrors.age?.length ? 'childAgeError' : undefined}
          >
            <option></option>
            {optionsAge.map((optionAge) => (
              <option key={optionAge}>{optionAge}</option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid" id="childAgeError">
            {fieldErrors.age?.[0] && t(fieldErrors.age[0])}
          </Form.Control.Feedback>
        </Form.Group>
      </Row>
      <Row className="mb-3">
        <Form.Group as={Col} controlId="childSex">
          <Form.Label>{t('children.sex')}</Form.Label>
          <Form.Select
            name="sex"
            isInvalid={!!fieldErrors.sex?.length}
            aria-invalid={!!fieldErrors.sex?.length}
            aria-describedby={fieldErrors.sex?.length ? 'childSexError' : undefined}
          >
            <option></option>
            {optionsSex.map((optionSex) => (
              <option key={optionSex} value={optionSex}>
                {t(`children.${optionSex}`)}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid" id="childSexError">
            {fieldErrors.sex?.[0] && t(fieldErrors.sex[0])}
          </Form.Control.Feedback>
        </Form.Group>
      </Row>
      <div className="mb-3">
        <Button type="submit" variant="success" disabled={isPending}>
          {isPending ? t('common.saving') : t('children.add')}
        </Button>
      </div>
    </Form>
  );
}

export default AddChildForm;
