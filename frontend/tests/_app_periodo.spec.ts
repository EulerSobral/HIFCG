import { useStore } from '../src/lib/store';


describe('Periodo', () => {
    const store = useStore.getState();
    const initialCount = store.periodos.length; 

    const novoPayload = {
        nome: '2024.1', 
        inicio: '2024-01-01',
        fim: '2024-06-30',
        inicioMatricula: '2024-01-01',
        fimMatricula: '2024-06-30',
        ativo: true
    }; 

    it('should add a periodo in the HIFCG', () => {
        store.addPeriodo(novoPayload); 

        const periodosAposInsercao = useStore.getState().periodos;
        expect(periodosAposInsercao.length).toBe(initialCount + 1); 

        const periodoInserido = periodosAposInsercao[periodosAposInsercao.length - 1];

        expect(periodoInserido).toBeDefined(); 
        expect(periodoInserido?.nome).toBe('2024.1');
        expect(periodoInserido?.inicio).toBe('2024-01-01');
        expect(periodoInserido?.fim).toBe('2024-06-30'); 
    }); 

    it('should update a periodo in the HIFCG', () => {
        store.addPeriodo(novoPayload); 
        const periodoInserido = store.periodos[store.periodos.length - 1];
        const idGerado = periodoInserido.id; 

        store.updatePeriodo(idGerado, {
            nome: '2024.2',
            inicio: '2024-07-01',
            fim: '2024-12-31'
        });  

        const periodosAposEdicao = useStore.getState().periodos;
        const periodoEditado = periodosAposEdicao.find(p => p.id === idGerado); 
    
        expect(periodoEditado?.nome).toBe('2024.2');
        expect(periodoEditado?.inicio).toBe('2024-07-01');
        expect(periodoEditado?.fim).toBe('2024-12-31'); 
    });  
 
    it('should remove a periodo in the HIFCG', () => {
        store.addPeriodo(novoPayload); 
        const periodoInserido = store.periodos[store.periodos.length - 1];
        const idGerado = periodoInserido.id; 

        store.removePeriodo(idGerado); 

        const periodosAposRemocao = useStore.getState().periodos;
        const periodoRemovido = periodosAposRemocao.find(p => p.id === idGerado); 
        expect(periodoRemovido).toBeUndefined(); 
    }); 

});
