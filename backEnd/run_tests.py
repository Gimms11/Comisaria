import os
import sys
import pytest

SERVICES = [
    ("packages/shared", None, ["packages/shared/tests/"]),
    ("ms-01-gateway-auth", "services/ms-01-gateway-auth", ["services/ms-01-gateway-auth/tests/"]),
    ("ms-02-denuncias-anonimas", "services/ms-02-denuncias-anonimas", ["services/ms-02-denuncias-anonimas/tests/"]),
    ("ms-03-reportes-ciudadanos", "services/ms-03-reportes-ciudadanos", ["services/ms-03-reportes-ciudadanos/tests/"]),
    ("ms-04-guias-contenido", "services/ms-04-guias-contenido", ["services/ms-04-guias-contenido/tests/"]),
]

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    all_passed = True
    results = {}

    print("=================================================================")
    print(" SUITE MASTER DE CALIDAD - BACKEND COMISARÍA LA TINGUIÑA")
    print("=================================================================\n")

    for name, rel_dir, test_paths in SERVICES:
        print(f"--> Ejecutando: [{name}]")
        sys_path_backup = list(sys.path)
        
        # Ajustar sys.path para cada microservicio
        if rel_dir:
            service_path = os.path.join(root_dir, rel_dir)
            sys.path.insert(0, service_path)
            # Limpiar módulos cacheados de 'app' y 'tests' para evitar cross-contamination
            to_del = [m for m in sys.modules if m == "app" or m.startswith("app.") or m == "tests" or m.startswith("tests.")]
            for m in to_del:
                del sys.modules[m]

        if root_dir not in sys.path:
            sys.path.insert(1, root_dir)

        abs_test_paths = [os.path.join(root_dir, p) for p in test_paths]
        ret = pytest.main(["-p", "no:cacheprovider", "-v"] + abs_test_paths)
        
        # Restaurar sys.path
        sys.path = sys_path_backup
        
        if ret == 0:
            print(f"    ==> [PASSED] {name}\n")
            results[name] = "PASSED"
        else:
            print(f"    ==> [FAILED] {name}\n")
            results[name] = "FAILED"
            all_passed = False

        print("-----------------------------------------------------------------")

    print("\n================== RESUMEN DE RESULTADOS ==================")
    for svc, status in results.items():
        print(f" - {svc.ljust(30)}: [{status}]")
    print("===========================================================")

    if all_passed:
        print("\n>>> ¡TODOS LOS MICROSERVICIOS CUMPLIERON EL 100% DE PRUEBAS EXITOSAMENTE! <<<")
        sys.exit(0)
    else:
        print("\n>>> EXISTEN PRUEBAS FALLIDAS. <<<")
        sys.exit(1)

if __name__ == "__main__":
    main()
