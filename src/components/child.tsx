import type { Sex } from '../model/child';
import Col from 'react-bootstrap/Col';
import Image from 'react-bootstrap/Image';
import styles from './child.module.scss'
import { X } from 'lucide-react';
import type { ClothesItem } from '../model/clothesDeterminer';

const imgUrlGirl = 'assets/img/girl.png';
const imgUrlBoy = 'assets/img/boy.png';

interface ChildProps {
    name: string;
    sex: Sex | null;
    allClothes: ClothesItem[];
    id: number;
    onClickDelete: (id: number) => void;
}


const Child = ({ name, sex, allClothes, id, onClickDelete }: ChildProps) => {

    const urlAvatar = sex === 'male' ? imgUrlBoy : sex === 'female' ? imgUrlGirl : '';

    return <>
            <Col xs={12} md={5} className={styles.child} id={String(id)}>
                <button onClick={() => onClickDelete(id)}><X size={20} strokeWidth={2} /></button>
                <Image className={styles.img} src={urlAvatar} alt="" roundedCircle />
                <h2 className={styles.name}>{name}</h2>
                <ul className={styles.clothes}>
                    { allClothes.map( (clothes, key) => <li key={key}>
                        <img src={clothes.imageUrl} alt=""/>
                        <p>{clothes.name}</p>
                    </li> )}
                </ul>
            </Col>
    </>
}

export default Child;