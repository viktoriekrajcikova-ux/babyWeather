import Alert from 'react-bootstrap/Alert';

interface MessageProps {
    id: string;
    text: string;
    variant: string;
}

function Message({ id, text, variant }: MessageProps) {
    return (
        <>
            <Alert id={id} key={variant} variant={variant}>
                {text}
            </Alert>
        </>
    );
}

export default Message;