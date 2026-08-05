package com.example.demo.Repository;

import com.example.demo.Entity.Periodo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PeriodoRepository extends JpaRepository<Periodo, Long> {
    Optional<Periodo> findByCodigo(String codigo);
    Optional<Periodo> findByAtivoTrue();
    boolean existsByCodigo(String codigo);
}
