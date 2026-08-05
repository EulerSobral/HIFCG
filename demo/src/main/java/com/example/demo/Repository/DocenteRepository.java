package com.example.demo.Repository;

import com.example.demo.Entity.Docente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocenteRepository extends JpaRepository<Docente, Long> {
    Optional<Docente> findByMatricula(String matricula);
    boolean existsByMatricula(String matricula);
    void deleteByMatricula(String matricula);
    List<Docente> findByNomeContainingIgnoreCase(String termo);
    List<Docente> findByDepartamento(String departamento);
}
