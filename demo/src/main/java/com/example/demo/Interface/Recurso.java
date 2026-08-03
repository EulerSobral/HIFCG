package com.example.demo.Interface;

public interface Recurso {
    void cadastrarRecurso(String codigo, String descricao);
    void alterarRecurso(String codigo, String descricao);
    void excluirRecurso(String codigo);
}
