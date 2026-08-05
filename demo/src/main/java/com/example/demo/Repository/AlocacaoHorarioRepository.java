package com.example.demo.Repository;

import com.example.demo.Entity.AlocacaoHorario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;

@Repository
public interface AlocacaoHorarioRepository extends JpaRepository<AlocacaoHorario, Long> {

    List<AlocacaoHorario> findByTurmaCursoCodigoAndPeriodoCodigo(String codigoCurso, String codigoPeriodo);

    List<AlocacaoHorario> findByDocenteMatriculaAndPeriodoCodigo(String matriculaDocente, String codigoPeriodo);

    @Query("SELECT a FROM AlocacaoHorario a WHERE a.ambiente.codigo = :codigoAmbiente AND a.diaSemana = :diaSemana AND a.periodo.codigo = :codigoPeriodo AND ((a.horarioInicio < :horarioFim AND a.horarioFim > :horarioInicio))")
    List<AlocacaoHorario> findChoquesAmbiente(
            @Param("codigoAmbiente") String codigoAmbiente,
            @Param("diaSemana") String diaSemana,
            @Param("codigoPeriodo") String codigoPeriodo,
            @Param("horarioInicio") LocalTime horarioInicio,
            @Param("horarioFim") LocalTime horarioFim
    );

    @Query("SELECT a FROM AlocacaoHorario a WHERE a.docente.matricula = :matriculaDocente AND a.diaSemana = :diaSemana AND a.periodo.codigo = :codigoPeriodo AND ((a.horarioInicio < :horarioFim AND a.horarioFim > :horarioInicio))")
    List<AlocacaoHorario> findChoquesDocente(
            @Param("matriculaDocente") String matriculaDocente,
            @Param("diaSemana") String diaSemana,
            @Param("codigoPeriodo") String codigoPeriodo,
            @Param("horarioInicio") LocalTime horarioInicio,
            @Param("horarioFim") LocalTime horarioFim
    );
}
