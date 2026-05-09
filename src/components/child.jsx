import React from 'react'
import Col from 'react-bootstrap/Col';
import Image from 'react-bootstrap/Image';
import {useState} from 'react';
import {useEffect} from 'react';
import styles from './child.module.scss'

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
    }, [])



    return <>
            <Col xs={12} md={5} className={styles.child} id={id}>
                <button onClick={() => onClickDelete(id)}>X</button>
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