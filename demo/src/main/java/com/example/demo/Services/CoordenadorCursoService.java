package com.example.demo.Services;

import com.example.demo.Interface.Recurso;
import org.springframework.stereotype.Service;

@Service
public class CoordenadorCursoService implements Recurso {

    public void login(String email, String password) {
    }

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


