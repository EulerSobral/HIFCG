package com.example.demo.Services;

import com.example.demo.Interface.CoordenadorFactory;
import com.example.demo.Interface.Recurso;
import org.springframework.stereotype.Service;

@Service
public class CoordenadorDepartamentoService implements CoordenadorFactory, Recurso {

    public void login(String email, String password) {
    }

    // implementa a interface CoordenadorFactory
    public void cadastrarCoordenador(String matricula, String nome, String email, String curso, String password) {
    }

    @Override
    public void removerCoordenador(String matricula) {
    }

    @Override
    public void alterarCoordenador(String matricula) {
    }

    // implementa a interface Recurso
    @Override
    public void cadastrarRecurso(String codigo, String descricao) {
    }

    @Override
    public void alterarRecurso(String codigo, String descricao) {
    }

    @Override
    public void excluirRecurso(String codigo) {
    }
}

