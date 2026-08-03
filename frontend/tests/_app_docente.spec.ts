import { useStore } from '../src/lib/store';

describe('Docente', () => { 
    const store = useStore.getState();
    const initialCount = store.docentes.length;   

    const novoPayload = { 
        nome: 'John Doe',
        email: 'john.doe@example.com',
        matricula: '12345',
        especialidade: 'Engenharia de Software' 
    }; 

    it('should add  an docente in the HIFCG', () => { 

    store.addDocente(novoPayload);

    const docentesAposInsercao = useStore.getState().docentes;
    
    expect(docentesAposInsercao.length).toBe(initialCount + 1); 
    
    const docenteInserido = docentesAposInsercao[docentesAposInsercao.length - 1];  

    expect(docenteInserido).toBeDefined();
    expect(docenteInserido?.nome).toBe('John Doe');
    expect(docenteInserido?.email).toBe('john.doe@example.com');
    expect(docenteInserido?.matricula).toBe('12345');
    expect(docenteInserido?.especialidade).toBe('Engenharia de Software');  
    }); 

    it('should update an docente in the HIFCG', () => {
        store.addDocente(novoPayload); 
        const docenteInserido = store.docentes[store.docentes.length - 1];
        const idGerado = docenteInserido.id; 

        useStore.getState().updateDocente(idGerado, {
            nome: 'Jane Doe',
            email: 'jane.doe@example.com',
            matricula: '67890',
            especialidade: 'Ciência da Computação'
        });

        const docenteAposEdicao = useStore.getState().docentes;
        const docenteEditado = docenteAposEdicao.find(d => d.id === idGerado);
        expect(docenteEditado?.nome).toBe('Jane Doe');
        expect(docenteEditado?.email).toBe('jane.doe@example.com');
        expect(docenteEditado?.matricula).toBe('67890');
        expect(docenteEditado?.especialidade).toBe('Ciência da Computação'); 
    });     

    it('should remove an docente in the HIFCG', () => {
        store.addDocente(novoPayload); 
        const docenteInserido = store.docentes[store.docentes.length - 1];
        const idGerado = docenteInserido.id;

        useStore.getState().removeDocente(idGerado);  

        const docentesAposRemocao = useStore.getState().docentes;
        const docenteRemovido = docentesAposRemocao.find(d => d.id === idGerado);
        expect(docenteRemovido).toBeUndefined(); 

    });

});