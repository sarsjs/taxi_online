import React, { useState } from 'react';  
  
const PackageDetailsForm = ({ onSubmit }) =
  const [details, setDetails] = useState({  
    descripcion: '',  
    tamano: 'pequeno',  
    peso: '',  
    contactoReceptor: '',  
    notasEntrega: ''  
  });  
  
  const handleSubmit = (e) = 
    e.preventDefault();  
    onSubmit(details);  
  };  
  
  return ( 
