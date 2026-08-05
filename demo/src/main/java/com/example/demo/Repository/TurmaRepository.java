package com.example.demo.Repository;

import com.example.demo.Entity.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TurmaRepository extends JpaRepository<Turma, Long> {
    Optional<Turma> findByCodigo(String codigo);
    List<Turma> findByCursoId(Long cursoId);
    List<Turma> findByCursoCodigo(String codigoCurso);
}
