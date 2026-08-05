package com.example.demo.Repository;

import com.example.demo.Entity.Disciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisciplinaRepository extends JpaRepository<Disciplina, Long> {
    Optional<Disciplina> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
    void deleteByCodigo(String codigo);
    List<Disciplina> findByCursoId(Long cursoId);
    List<Disciplina> findByCursoCodigo(String codigoCurso);
}
