package com.example.demo.Interface;

import java.util.Map;

public interface CoordenadorFactory {
    void cadastrarCoordenador(String matricula, String nome, String email, String curso, String password);
    void removerCoordenador(String matricula);
    void alterarCoordenador(String matricula, Map<String, String> dados);
}
