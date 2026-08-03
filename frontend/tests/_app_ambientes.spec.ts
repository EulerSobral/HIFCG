import { useStore } from '../src/lib/store';

describe('Ambiente', () => {
   
    const store = useStore.getState();
    const initialCount = store.ambientes.length; 
    
    const novoPayload = {
      codigo: 'A101',
      tipo: 'Sala' as const,
      capacidade: 30,
      bloco: 'B',
    };
  
    it('should add  an ambiente in the HIFCG', () => {
    
    
    store.addAmbiente(novoPayload);

    const ambientesAposInsercao = useStore.getState().ambientes;
    expect(ambientesAposInsercao.length).toBe(initialCount + 1);

    const ambienteInserido = ambientesAposInsercao.find(a => a.codigo === 'A101');
    expect(ambienteInserido).toBeDefined();
    expect(ambienteInserido?.tipo).toBe('Sala');
    expect(ambienteInserido?.capacidade).toBe(30);
    expect(ambienteInserido?.bloco).toBe('B'); 

  }); 

  it('should update an ambiente in the HIFCG', () => { 
    
    store.addAmbiente(novoPayload);

    const ambienteInserido = store.ambientes[store.ambientes.length - 1];
    const idGerado = ambienteInserido.id;

    // 2. Editar o ambiente cadastrado
    useStore.getState().updateAmbiente(idGerado, {
      capacidade: 35,
      bloco: 'C',
    });


    const ambientesAposEdicao = useStore.getState().ambientes;
    const ambienteEditado = ambientesAposEdicao.find(a => a.id === idGerado);
    expect(ambienteEditado?.capacidade).toBe(35);
    expect(ambienteEditado?.bloco).toBe('C'); 
  }); 

  it('should remove an ambiente in the HIFCG', () => {

    store.addAmbiente(novoPayload);

    const ambienteInserido = store.ambientes[store.ambientes.length - 1];
    const idGerado = ambienteInserido.id;

     // 3. Remover o ambiente
    useStore.getState().removeAmbiente(idGerado);

    const ambientesAposRemocao = useStore.getState().ambientes;
    expect(ambientesAposRemocao.find(a => a.id === idGerado)).toBeUndefined();

    });

});