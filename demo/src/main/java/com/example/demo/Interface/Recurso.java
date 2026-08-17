package com.example.demo.Interface;

import java.util.Map;

public interface Recurso {
    void cadastrarRecurso(int tipo_recurso, Map<String, Object> dados);
    void alterarRecurso(int tipo_recurso, Map<String, Object> dados);
    void excluirRecurso(int tipo_recurso, String identificador);
}
