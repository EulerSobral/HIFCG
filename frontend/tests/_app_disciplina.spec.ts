import { useStore } from '../src/lib/store'; 

describe('Disciplina', () => {
    const store = useStore.getState();
    const initialCount = store.disciplinas.length;  

     const novoPayload = {
            codigo: 'MAT101',
            nome: 'Matemática Básica', 
            cursoId: '01',
            ementa: 'Introdução à Matemática',
            especialidade: 'Matemática', 
            cargaHoraria: 60
        };  
        
    it('should add a disciplina in the HIFCG', () => {

        store.addDisciplina(novoPayload);  

        const disciplinasAposInsercao = useStore.getState().disciplinas;
        expect(disciplinasAposInsercao.length).toBe(initialCount + 1); 
        
        const disciplinaInserida = disciplinasAposInsercao[disciplinasAposInsercao.length - 1];
        
        expect(disciplinaInserida).toBeDefined();
        expect(disciplinaInserida?.codigo).toBe('MAT101');
        expect(disciplinaInserida?.nome).toBe('Matemática Básica');
        expect(disciplinaInserida?.cargaHoraria).toBe(60);
        expect(disciplinaInserida?.cursoId).toBe('01'); 
    }); 

    it('should update a disciplina in the HIFCG', () => {
        store.addDisciplina(novoPayload); 
        const disciplinaInserida = store.disciplinas[store.disciplinas.length - 1];
        const idGerado = disciplinaInserida.id; 

        store.updateDisciplina(idGerado, {
            codigo: 'MAT102',
            nome: 'Matemática Avançada',
            cargaHoraria: 80,
            cursoId: '02'
        }); 

        const disciplinasAposEdicao = useStore.getState().disciplinas; 

        const disciplinaEditada = disciplinasAposEdicao.find(d => d.id === idGerado);
     
        expect(disciplinaEditada?.codigo).toBe('MAT102');
        expect(disciplinaEditada?.nome).toBe('Matemática Avançada');
        expect(disciplinaEditada?.cargaHoraria).toBe(80);
        expect(disciplinaEditada?.cursoId).toBe('02'); 
    });  

    it('should remove a disciplina in the HIFCG', () => {
        store.addDisciplina(novoPayload); 
        const disciplinaInserida = store.disciplinas[store.disciplinas.length - 1];
        const idGerado = disciplinaInserida.id;  

        store.removeDisciplina(idGerado);

        const disciplinasAposRemocao = useStore.getState().disciplinas; 
        const disciplinaRemovida = disciplinasAposRemocao.find(d => d.id === idGerado); 

        expect(disciplinaRemovida).toBeUndefined();
    });
});