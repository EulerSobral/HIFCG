import { useStore } from '../src/lib/store';

describe('Curso', () => {
    const store = useStore.getState();
    const initialCount = store.cursos.length; 

    const novoPayload = {
        codigo: 'ENG101',
        nome: 'Engenharia de Software',  
        turno: 'Integral',
        nivel: 'Superior', 
        departamento: 'Computação'
    } as const;   


    it('should add a curso in the HIFCG', () => {
        store.addCurso(novoPayload); 

        const cursosAposInsercao = useStore.getState().cursos;
        expect(cursosAposInsercao.length).toBe(initialCount + 1); 

        const cursoInserido = cursosAposInsercao[cursosAposInsercao.length - 1];

        expect(cursoInserido).toBeDefined(); 
        expect(cursoInserido.nome).toBe('Engenharia de Software');
        expect(cursoInserido.turno).toBe('Integral');
        expect(cursoInserido.nivel).toBe('Superior');
        expect(cursoInserido.departamento).toBe('Computação');
    });  

    it('should update a curso in the HIFCG', () => { 
        store.addCurso(novoPayload);
        
        const cursoInserido = store.cursos[store.cursos.length - 1];
        const idGerado = cursoInserido.id; 

        store.updateCurso(idGerado, {
            nome: 'Engenharia de Computação',
            turno: 'Noturno',
            nivel: 'Pós-Graduação',
            departamento: 'Computação'
        });  

        const cursosAposEdicao = useStore.getState().cursos;
        const cursoEditado = cursosAposEdicao.find(c => c.id === idGerado); 
        expect(cursoEditado?.nome).toBe('Engenharia de Computação');
        expect(cursoEditado?.turno).toBe('Noturno');
        expect(cursoEditado?.nivel).toBe('Pós-Graduação');
        expect(cursoEditado?.departamento).toBe('Computação'); 
    }); 

    it('should remove a curso in the HIFCG', () => {
        store.addCurso(novoPayload); 
        const cursoInserido = store.cursos[store.cursos.length - 1];
        const idGerado = cursoInserido.id; 

        store.removeCurso(idGerado);

        const cursosAposRemocao = useStore.getState().cursos; 
        const cursoRemovido = cursosAposRemocao.find(c => c.id === idGerado); 
        expect(cursoRemovido).toBeUndefined(); 
    }); 
});