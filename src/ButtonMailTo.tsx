import React from "react";
import Button  from 'react-bootstrap/Button';
import { isWhiteSpaceLike } from "typescript";

const ButtonMailto = ({ mailto, label }) => {


    const style = {
        backgroundColor: 'green',
        borderColor: 'green',
        color: 'white',
        padding: '10px 5px'
      };

      
    return (
        <Button style={style} 
            onClick={(e) => {
                window.location = mailto;
                e.preventDefault();
            }}
        >
            {label}
        </Button>
    );
};

export default ButtonMailto;