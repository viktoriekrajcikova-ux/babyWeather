import Col from 'react-bootstrap/Col';
import Image from 'react-bootstrap/Image';
import {useState} from 'react';
import {useEffect} from 'react';
import styles from './child.module.scss'
import { X } from 'lucide-react';

const imgUrlGirl = 'assets/img/girl.png';
const imgUrlBoy = 'assets/img/boy.png';


const Child = ({name, sex, allClothes, id, onClickDelete }) => {

    const [urlAvatar, setUrlAvatar] = useState('')

    useEffect(() => {
        if (sex === 'male') {
            return setUrlAvatar(imgUrlBoy)
        }

        if (sex === 'female') {
            return setUrlAvatar(imgUrlGirl)
        }
        // sex je prop nastavený jednou rodičem a po mountu se nemění, proto je prázdné pole závislostí záměr
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])



    return <>
            <Col xs={12} md={5} className={styles.child} id={id}>
                <button onClick={() => onClickDelete(id)}><X size={20} strokeWidth={2} /></button>
                <Image className={styles.img} src={urlAvatar} roundedCircle />
                <h2 className={styles.name}>{name}</h2>
                <ul className={styles.clothes}>
                    { allClothes.map( (clothes, key) => <li key={key}>
                        <img src={clothes.imageUrl}/>
                        <p>{clothes.name}</p>
                    </li> )}
                </ul>
            </Col>
    </>
}

export default Child;